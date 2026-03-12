import { Injectable } from '@nestjs/common';
import { OrderState, Prisma, PrismaClient, SeatStatus } from '@prisma/client';
import { CreateOrderPayload } from './types/create-order-payload.type';

type DbClient = Prisma.TransactionClient | PrismaClient;

@Injectable()
export class OrdersRepository {
  async findShow(tx: Prisma.TransactionClient, showId: string) {
    return tx.show.findFirst({ where: { id: showId, deletedAt: null, isArchive: false } });
  }

  async findHallSeats(tx: Prisma.TransactionClient, hallId: string, hallSeatIds: string[]) {
    return tx.hallSeat.findMany({ where: { hallId, id: { in: hallSeatIds }, deletedAt: null } });
  }

  async findSeatStates(tx: Prisma.TransactionClient, showId: string, hallSeatIds: string[]) {
    return tx.showSeat.findMany({
      where: {
        showId,
        hallSeatId: { in: hallSeatIds },
        deletedAt: null,
      },
    });
  }

  async findSeatStatesByShowSeatIds(tx: Prisma.TransactionClient, showId: string, showSeatIds: string[]) {
    return tx.showSeat.findMany({
      where: { showId, id: { in: showSeatIds }, deletedAt: null },
      select: { id: true, hallSeatId: true },
    });
  }

  async createMissingSeatStates(tx: Prisma.TransactionClient, showId: string, hallSeatIds: string[]) {
    await tx.showSeat.createMany({
      data: hallSeatIds.map((hallSeatId) => ({
        showId,
        hallSeatId,
        status: SeatStatus.AVAILABLE,
      })),
      skipDuplicates: true,
    });
  }

  async reserveSeats(tx: Prisma.TransactionClient, showId: string, hallSeatIds: string[], reservedUntil: Date) {
    return tx.showSeat.updateMany({
      where: {
        showId,
        hallSeatId: { in: hallSeatIds },
        deletedAt: null,
        OR: [
          { status: SeatStatus.AVAILABLE },
          { status: SeatStatus.RESERVED, reservedUntil: { lt: new Date() } },
        ],
      },
      data: { status: SeatStatus.RESERVED, reservedUntil },
    });
  }

  async findReservedSeatRows(tx: Prisma.TransactionClient, showId: string, hallSeatIds: string[]) {
    return tx.showSeat.findMany({ where: { showId, hallSeatId: { in: hallSeatIds }, deletedAt: null } });
  }

  async createPendingOrderWithItems(tx: Prisma.TransactionClient, payload: CreateOrderPayload) {
    const { dto, orderCode, now } = payload;
    const order = await tx.order.create({
      data: {
        orderCode,
        customerId: dto.customerId,
        eventId: dto.eventId,
        showId: dto.showId,
        promoCodeId: dto.promoCodeId,
        name: dto.name,
        email: dto.email,
        mobileNumber: dto.mobileNumber,
        total: new Prisma.Decimal(dto.total),
        discount: dto.discount !== undefined ? new Prisma.Decimal(dto.discount) : null,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        state: OrderState.PENDING,
        createdAt: now,
      },
    });
    await tx.orderItem.createMany({
      data: dto.ticketItems.map((item) => ({
        orderId: order.id,
        seatId: item.seatId,
        price: new Prisma.Decimal(item.price),
      })),
    });
    return tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
  }

  async incrementShowSoldTickets(tx: Prisma.TransactionClient, showId: string, amount: number) {
    await tx.show.update({
      where: { id: showId },
      data: { totalSoldTickets: { increment: amount } },
    });
  }

  async incrementPromoUsage(tx: Prisma.TransactionClient, promoCodeId: string) {
    await tx.promocode.updateMany({
      where: { id: promoCodeId, deletedAt: null, isActive: true, maxlimit: { gt: 0 } },
      data: { usageCount: { increment: 1 }, maxlimit: { decrement: 1 } },
    });
  }

  async findById(db: DbClient, orderId: string) {
    return db.order.findUnique({
      where: { id: orderId },
      include: { event: { select: { id: true, slug: true, name: true } }, items: { include: { seat: true } } },
    });
  }

  async list(db: DbClient, where: Prisma.OrderWhereInput, skip: number, take: number) {
    return db.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { items: true } });
  }

  count(db: DbClient, where: Prisma.OrderWhereInput) {
    return db.order.count({ where });
  }

  async findOrderWithItems(tx: Prisma.TransactionClient, orderId: string) {
    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { seat: true } } },
    });
  }

  async confirmPendingOrder(tx: Prisma.TransactionClient, orderId: string, transactionId?: string) {
    return tx.order.update({
      where: { id: orderId },
      data: { state: OrderState.CONFIRMED, transactionId, isActive: true },
      include: { items: { include: { seat: true } } },
    });
  }

  async expirePendingOrder(tx: Prisma.TransactionClient, orderId: string) {
    return tx.order.update({
      where: { id: orderId },
      data: { state: OrderState.EXPIRED, isActive: false },
      include: { items: { include: { seat: true } } },
    });
  }

  async releaseShowSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    if (!seatIds.length) return;
    await tx.showSeat.updateMany({
      where: { id: { in: seatIds }, deletedAt: null, status: SeatStatus.RESERVED },
      data: { status: SeatStatus.AVAILABLE, reservedUntil: null },
    });
  }

  async bookShowSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    if (!seatIds.length) return;
    await tx.showSeat.updateMany({
      where: { id: { in: seatIds }, deletedAt: null },
      data: { status: SeatStatus.BOOKED, reservedUntil: null },
    });
  }

  async deactivateOrderItems(tx: Prisma.TransactionClient, orderId: string) {
    await tx.orderItem.updateMany({ where: { orderId }, data: { isActive: false } });
  }

  async findExpiredPendingOrderIds(db: DbClient, now: Date, limit: number) {
    const rows = await db.order.findMany({
      where: {
        state: OrderState.PENDING,
        deletedAt: null,
        items: {
          some: {
            seat: { status: SeatStatus.RESERVED, reservedUntil: { lt: now }, deletedAt: null },
          },
        },
      },
      take: limit,
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async listPendingOrders(db: DbClient) {
    return db.order.findMany({
      where: { state: OrderState.PENDING, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { items: true },
      take: 200,
    });
  }

  async listActiveReservations(db: DbClient, now: Date) {
    return db.showSeat.findMany({
      where: { status: SeatStatus.RESERVED, reservedUntil: { gt: now }, deletedAt: null },
      orderBy: { reservedUntil: 'asc' },
      include: { show: true, hallSeat: true },
      take: 500,
    });
  }
}
