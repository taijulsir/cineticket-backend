import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import {
  CreateAdminAdsDto,
  CreateAdminEventDto,
  CreateAdminHallDto,
  CreateAdminHallSeatDto,
  CreateAdminHeroSliderDto,
  CreateAdminPromoCodeDto,
  CreateAdminSocialLinkDto,
  CreateAdminShowDto,
  CreateAdminTheaterDto,
  UpdateAdminAdsDto,
  UpdateAdminEventDto,
  UpdateAdminHallSeatDto,
  UpdateAdminHeroSliderDto,
  UpdateAdminPromoCodeDto,
  UpdateAdminSocialLinkDto,
  UpdateAdminShowDto,
} from './dto/admin-crud.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly ordersService: OrdersService) {}

  getActiveReservations() {
    return this.ordersService.listActiveReservations();
  }

  getPendingOrders() {
    return this.ordersService.listPendingOrders();
  }

  createEvent(dto: CreateAdminEventDto) {
    const { posterUrl, ...rest } = dto;
    return this.prisma.event.create({
      data: { ...rest, cardImage: posterUrl ?? dto.cardImage, releaseDate: new Date(dto.releaseDate) },
    });
  }

  updateEvent(id: string, dto: UpdateAdminEventDto) {
    const { posterUrl, ...rest } = dto;
    return this.prisma.event.update({
      data: {
        ...rest,
        ...(posterUrl && { cardImage: posterUrl }),
        ...(dto.releaseDate && { releaseDate: new Date(dto.releaseDate) }),
      },
      where: { id },
    });
  }

  deleteEvent(id: string) {
    return this.prisma.event.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  async createShow(dto: CreateAdminShowDto) {
    const location = await this.resolveLocationIds(dto.theaterId);
    return this.prisma.show.create({
      data: {
        ...dto,
        cityId: location.cityId,
        stateId: location.stateId,
        countryId: location.countryId,
        date: new Date(dto.date),
        totalSoldTickets: 0,
      },
    });
  }

  async updateShow(id: string, dto: UpdateAdminShowDto) {
    const location = dto.theaterId ? await this.resolveLocationIds(dto.theaterId) : null;
    return this.prisma.show.update({
      data: {
        ...dto,
        ...(dto.date && { date: new Date(dto.date) }),
        ...(location && { cityId: location.cityId, stateId: location.stateId, countryId: location.countryId }),
      },
      where: { id },
    });
  }

  createTheater(dto: CreateAdminTheaterDto) {
    return this.prisma.theater.create({ data: dto });
  }

  createHall(dto: CreateAdminHallDto) {
    return this.prisma.hall.create({ data: dto });
  }

  getHalls() {
    return this.prisma.hall.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { theater: { include: { city: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  archiveHall(id: string) {
    return this.prisma.hall.update({
      where: { id },
      data: { isArchive: true, deletedAt: new Date() },
    });
  }

  async deleteHall(id: string) {
    await this.prisma.hallSeat.updateMany({
      where: { hallId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return this.prisma.hall.update({
      where: { id },
      data: { isArchive: true, deletedAt: new Date() },
    });
  }

  createHallSeat(dto: CreateAdminHallSeatDto) {
    return this.prisma.hallSeat.create({ data: dto });
  }

  getHallSeats(hallId: string) {
    return this.prisma.hallSeat.findMany({
      where: { hallId, deletedAt: null },
      orderBy: [{ row: 'asc' }, { column: 'asc' }],
    });
  }

  updateHallSeat(id: string, dto: UpdateAdminHallSeatDto) {
    return this.prisma.hallSeat.update({ where: { id }, data: dto });
  }

  getHeroSliders() {
    return this.prisma.heroSlider.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { event: { select: { id: true, name: true } } },
      orderBy: { precedence: 'asc' },
    });
  }

  createHeroSlider(dto: CreateAdminHeroSliderDto) {
    return this.prisma.heroSlider.create({ data: dto });
  }

  updateHeroSlider(id: string, dto: UpdateAdminHeroSliderDto) {
    return this.prisma.heroSlider.update({ where: { id }, data: dto });
  }

  deleteHeroSlider(id: string) {
    return this.prisma.heroSlider.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  getAds() {
    return this.prisma.ads.findMany({
      where: { deletedAt: null, isArchive: false },
      orderBy: { precedence: 'asc' },
    });
  }

  createAds(dto: CreateAdminAdsDto) {
    return this.prisma.ads.create({ data: dto });
  }

  updateAds(id: string, dto: UpdateAdminAdsDto) {
    return this.prisma.ads.update({ where: { id }, data: dto });
  }

  deleteAds(id: string) {
    return this.prisma.ads.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  getSocialLinks() {
    return this.prisma.socialLink.findMany({
      where: { deletedAt: null, isArchive: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  createSocialLink(dto: CreateAdminSocialLinkDto) {
    return this.prisma.socialLink.create({ data: { ...dto, isArchive: false } });
  }

  updateSocialLink(id: string, dto: UpdateAdminSocialLinkDto) {
    return this.prisma.socialLink.update({ where: { id }, data: dto });
  }

  deleteSocialLink(id: string) {
    return this.prisma.socialLink.update({ where: { id }, data: { isArchive: true, deletedAt: new Date() } });
  }

  createPromoCode(dto: CreateAdminPromoCodeDto) {
    const { usageCount, ...rest } = dto;
    return this.prisma.promocode.create({
      data: {
        ...rest,
        usageCount: usageCount ?? 0,
        discountAmount: new Prisma.Decimal(dto.discountAmount),
      },
    });
  }

  getPromoCodes() {
    return this.prisma.promocode.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  updatePromoCode(id: string, dto: UpdateAdminPromoCodeDto) {
    return this.prisma.promocode.update({
      where: { id },
      data: { ...dto, ...(dto.discountAmount !== undefined && { discountAmount: new Prisma.Decimal(dto.discountAmount) }) },
    });
  }

  deletePromoCode(id: string) {
    return this.prisma.promocode.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  }

  async getStats() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const [totalEvents, totalShows, totalOrders, todayRevenue, tickets] = await Promise.all([
      this.prisma.event.count({ where: { deletedAt: null, isArchive: false } }),
      this.prisma.show.count({ where: { deletedAt: null, isArchive: false } }),
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start }, state: 'CONFIRMED', deletedAt: null },
        _sum: { total: true },
      }),
      this.prisma.show.aggregate({ where: { deletedAt: null }, _sum: { totalSoldTickets: true } }),
    ]);
    return {
      totalEvents,
      totalShows,
      totalOrders,
      todayRevenue: Number(todayRevenue._sum.total ?? 0),
      totalTicketsSold: tickets._sum.totalSoldTickets ?? 0,
    };
  }

  getTheaters() {
    return this.prisma.theater.findMany({
      where: { deletedAt: null, isArchive: false },
      include: { country: true, state: true, city: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
    const [employees, customers] = await Promise.all([
      this.prisma.employee.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } }),
      this.prisma.customer.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } }),
    ]);
    const userMap = new Map([...employees, ...customers].map((u) => [u.id, u]));
    const data = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      user: row.userId ? userMap.get(row.userId) ?? null : null,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));
    return { data, meta: { page, limit, total } };
  }

  private async resolveLocationIds(theaterId: string) {
    const theater = await this.prisma.theater.findUnique({
      where: { id: theaterId },
      select: { cityId: true, stateId: true, countryId: true },
    });
    if (!theater) throw new NotFoundException('Theater not found');
    return theater;
  }
}
