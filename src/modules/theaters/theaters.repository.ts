import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class TheatersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.TheaterWhereInput, skip: number, take: number) {
    return this.prisma.theater.findMany({
      where,
      skip,
      take,
      include: {
        city: true,
        _count: { select: { halls: true } },
      },
    });
  }

  count(where: Prisma.TheaterWhereInput) {
    return this.prisma.theater.count({ where });
  }

  findBySlug(slug: string) {
    return (this.prisma.theater as any).findFirst({
      where: { slug, deletedAt: null },
      include: {
        city: true,
        state: true,
        country: true,
        halls: {
          where: { isArchive: false, deletedAt: null },
        },
      },
    });
  }

  findShows(theaterId: string) {
    const now = new Date();
    return this.prisma.show.findMany({
      where: {
        theaterId,
        date: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        isArchive: false,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            cardImage: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}
