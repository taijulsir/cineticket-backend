import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        dp: true,
        gender: true,
        isVerified: true,
        isSocial: true,
        country: true,
        city: true,
        createdAt: true,
      },
    });
  }

  findProfileWithOrders(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        dp: true,
        gender: true,
        isVerified: true,
        isSocial: true,
        country: true,
        city: true,
        createdAt: true,
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderCode: true,
            state: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
