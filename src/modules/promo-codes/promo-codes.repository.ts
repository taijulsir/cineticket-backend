import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class PromoCodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCode(promoCode: string) {
    return this.prisma.promocode.findFirst({
      where: { promoCode, deletedAt: null },
    });
  }

  listActiveOffers(now: Date) {
    return this.prisma.promocode.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        maxlimit: { gt: 0 },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
