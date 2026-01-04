import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.EventWhereInput, skip: number, take: number) {
    return this.prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: { releaseDate: 'desc' },
    });
  }

  count(where: Prisma.EventWhereInput) {
    return this.prisma.event.count({ where });
  }
}
