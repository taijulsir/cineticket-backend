import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderState, Prisma, SeatStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { RESERVATION_EXPIRE_JOB, RESERVATION_EXPIRY_QUEUE } from '../../queues/reservation-expiry.queue';
import { getPagination } from '../../utils/pagination.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: OrdersRepository,
    private readonly redis: RedisService,
    @InjectQueue(RESERVATION_EXPIRY_QUEUE) private readonly reservationQueue: Queue,
  ) {}

  async create(dto: CreateOrderDto) {
    const now = new Date();
    const holdMs = 5 * 60 * 1000;
    const reservedUntil = new Date(now.getTime() + holdMs);
    const lockOwner = randomUUID();
    const inputSeatIds = [...new Set(dto.ticketItems.map((item) => item.seatId))];
    if (inputSeatIds.length !== dto.ticketItems.length) throw new ConflictException('Duplicate seats in payload');

    let lockedHallSeatIds: string[] = [];
    try {
      const order = await this.prisma.$transaction(
        async (tx) => {
          const show = await this.repository.findShow(tx, dto.showId);
          if (!show) throw new NotFoundException('Show not found');

          const legacyRows = await this.repository.findSeatStatesByShowSeatIds(tx, dto.showId, inputSeatIds);
          const usingLegacyIds = legacyRows.length === inputSeatIds.length;
          const legacyMap = new Map(legacyRows.map((row) => [row.id, row.hallSeatId]));
          const hallSeatIds = usingLegacyIds
            ? dto.ticketItems.map((item) => legacyMap.get(item.seatId) as string)
            : dto.ticketItems.map((item) => item.seatId);
          const uniqueHallSeatIds = [...new Set(hallSeatIds)];

          lockedHallSeatIds = await this.acquireSeatLocks(dto.showId, uniqueHallSeatIds, lockOwner, holdMs);
          const hallSeats = await this.repository.findHallSeats(tx, show.hallId, uniqueHallSeatIds);
          if (hallSeats.length !== uniqueHallSeatIds.length) throw new NotFoundException('One or more seats are invalid');

          const seatStates = await this.repository.findSeatStates(tx, dto.showId, uniqueHallSeatIds);
          const conflicting = seatStates.some(
            (seat) =>
              seat.status === SeatStatus.BOOKED ||
              seat.status === SeatStatus.BLOCKED ||
              (seat.status === SeatStatus.RESERVED && !!seat.reservedUntil && seat.reservedUntil > now),
          );
          if (conflicting) throw new ConflictException('Some seats are not available');

          await this.repository.createMissingSeatStates(tx, dto.showId, uniqueHallSeatIds);
          const reserved = await this.repository.reserveSeats(tx, dto.showId, uniqueHallSeatIds, reservedUntil);
          if (reserved.count !== uniqueHallSeatIds.length) throw new ConflictException('Seat booking conflict');

          const reservedRows = await this.repository.findReservedSeatRows(tx, dto.showId, uniqueHallSeatIds);
          const seatByHallSeatId = new Map(reservedRows.map((row) => [row.hallSeatId, row.id]));
          const orderDto: CreateOrderDto = {
            ...dto,
            ticketItems: dto.ticketItems.map((item, idx) => {
              const hallSeatId = hallSeatIds[idx];
              const mappedSeatId = seatByHallSeatId.get(hallSeatId);
              if (!mappedSeatId) throw new ConflictException('Seat mapping failed');
              return { ...item, seatId: mappedSeatId };
            }),
          };

          const orderCode = this.generateOrderCode(now);
          const order = await this.repository.createPendingOrderWithItems(tx, { dto: orderDto, orderCode, now });
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await this.reservationQueue.add(
        RESERVATION_EXPIRE_JOB,
        { orderId: order!.id },
        {
          delay: holdMs,
          jobId: `reservation-expire-${order!.id}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      return { ...order, state: OrderState.PENDING, reservedUntil };
    } catch (error) {
      await this.redis.releaseSeatLocks(dto.showId, lockedHallSeatIds);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Some seats are not available');
      }
      throw error;
    }
  }

  async confirmOrder(orderId: string, transactionId?: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await this.repository.findOrderWithItems(tx, orderId);
      if (!current) throw new NotFoundException('Order not found');
      if (current.state === OrderState.CONFIRMED) return current;
      if (current.state !== OrderState.PENDING) throw new ConflictException('Order is not pending');

      const seatIds = current.items.map((item) => item.seatId);
      await this.repository.bookShowSeats(tx, seatIds);
      await this.repository.incrementShowSoldTickets(tx, current.showId, seatIds.length);
      if (current.promoCodeId) await this.repository.incrementPromoUsage(tx, current.promoCodeId);
      return this.repository.confirmPendingOrder(tx, orderId, transactionId);
    });

    await this.releaseLocksForOrder(order);
    return order;
  }

  async expireOrder(orderId: string, reason = 'timeout') {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await this.repository.findOrderWithItems(tx, orderId);
      if (!current) return null;
      if (current.state !== OrderState.PENDING) return current;
      const seatIds = current.items.map((item) => item.seatId);
      await this.repository.releaseShowSeats(tx, seatIds);
      await this.repository.deactivateOrderItems(tx, current.id);
      await tx.auditLog.create({
        data: {
          userId: current.customerId,
          action: 'ORDER_EXPIRED',
          resource: 'order',
          resourceId: current.id,
          metadata: { reason, showId: current.showId },
        },
      });
      return this.repository.expirePendingOrder(tx, current.id);
    });

    if (order) await this.releaseLocksForOrder(order);
    return order;
  }

  async expireOrderByTimeout(orderId: string) {
    const order = await this.expireOrder(orderId, 'reservation_timeout');
    return !!order && order.state === OrderState.EXPIRED;
  }

  async expireDueReservations(limit = 100) {
    const orderIds = await this.repository.findExpiredPendingOrderIds(this.prisma, new Date(), limit);
    let expired = 0;
    for (const orderId of orderIds) {
      if (await this.expireOrderByTimeout(orderId)) expired += 1;
    }
    return expired;
  }

  async findOne(orderId: string) {
    const order = await this.repository.findById(this.prisma, orderId);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async list(query: OrderQueryDto) {
    const { skip, limit, page } = getPagination(query.page, query.limit);
    const where: Prisma.OrderWhereInput = { deletedAt: null, ...(query.customerId && { customerId: query.customerId }) };
    const [data, total] = await Promise.all([
      this.repository.list(this.prisma, where, skip, limit),
      this.repository.count(this.prisma, where),
    ]);
    return { data, meta: { page, limit, total } };
  }

  listPendingOrders() {
    return this.repository.listPendingOrders(this.prisma);
  }

  listActiveReservations() {
    return this.repository.listActiveReservations(this.prisma, new Date());
  }

  private async acquireSeatLocks(showId: string, hallSeatIds: string[], owner: string, ttlMs: number) {
    const locked: string[] = [];
    for (const hallSeatId of hallSeatIds) {
      const ok = await this.redis.acquireSeatLock(showId, hallSeatId, owner, ttlMs);
      if (!ok) {
        await this.redis.releaseSeatLocks(showId, locked);
        throw new ConflictException('Some seats are currently locked');
      }
      locked.push(hallSeatId);
    }
    return locked;
  }

  private async releaseLocksForOrder(order: { showId: string; items: { seat: { hallSeatId: string } }[] }) {
    const hallSeatIds = order.items.map((item) => item.seat.hallSeatId);
    await this.redis.releaseSeatLocks(order.showId, hallSeatIds);
  }

  private generateOrderCode(date: Date) {
    const year = date.getUTCFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${year}-${rand}`;
  }
}
