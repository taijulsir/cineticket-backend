import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ShowSeatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getShowWithHall(showId: string) {
    return this.prisma.show.findFirst({
      where: { id: showId, deletedAt: null, isArchive: false },
      select: { id: true, hallId: true },
    });
  }

  getHallLayoutWithShowSeats(hallId: string, showId: string) {
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
