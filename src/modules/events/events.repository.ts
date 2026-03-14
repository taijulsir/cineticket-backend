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
      include: { crews: { where: { type: 'GENRE', deletedAt: null }, select: { name: true } } },
    });
  }

  count(where: Prisma.EventWhereInput) {
    return this.prisma.event.count({ where });
  }

  findBySlug(slug: string) {
    return this.prisma.event.findFirst({
      where: { slug, deletedAt: null, isArchive: false },
      include: {
        crews: { where: { type: 'GENRE', deletedAt: null }, select: { name: true } },
        shows: {
          where: { deletedAt: null, isArchive: false },
          include: { theater: true, hall: true },
          orderBy: { date: 'asc' },
        },
      },
    });
  }

  findRelated(eventId: string, limit = 6) {
    return this.prisma.event.findMany({
      where: { id: { not: eventId }, deletedAt: null, isArchive: false, type: 'MOVIE' },
      orderBy: { releaseDate: 'desc' },
      take: limit,
      include: { crews: { where: { type: 'GENRE', deletedAt: null }, select: { name: true } } },
    });
  }

  findCustomerUpvotes(customerId: string) {
    return this.prisma.eventUpvote.findMany({
      where: { customerId, deletedAt: null },
      include: { event: true },
    });
  }
}
