import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ShowsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.ShowWhereInput, skip: number, take: number) {
    return this.prisma.show.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'asc' },
      include: { event: true, hall: true, theater: true },
    });
  }

  count(where: Prisma.ShowWhereInput) {
    return this.prisma.show.count({ where });
  }

  findShow(showId: string) {
    return this.prisma.show.findFirst({ where: { id: showId, deletedAt: null, isArchive: false } });
  }

  getLayout(hallId: string, showId: string) {
    return this.prisma.hallSeat.findMany({
      where: { hallId, deletedAt: null },
      orderBy: [{ row: 'asc' }, { column: 'asc' }],
      include: {
        showSeats: {
          where: { showId, deletedAt: null },
          select: { id: true, status: true, reservedUntil: true },
          take: 1,
        },
      },
    });
  }
}
