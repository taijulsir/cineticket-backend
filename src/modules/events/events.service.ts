import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../../utils/pagination.util';
import { QueryEventsDto } from './dto/query-events.dto';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  private enrichMoviePayload<T extends { crews?: Array<{ name: string }>; releaseDate: Date; location: string }>(
    event: T,
  ) {
    const { crews, ...rest } = event;
    return {
      ...rest,
      crews: crews ?? [],
      language: rest.location,
      genres: (crews ?? []).map((item) => item.name),
      format: '2D',
      year: new Date(rest.releaseDate).getUTCFullYear(),
    };
  }

  async getAll(query: QueryEventsDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      isArchive: false,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { organizer: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);
    return { data: data.map((item) => this.enrichMoviePayload(item)), meta: { page, limit, total } };
  }

  async getBySlug(slug: string) {
    const event = await this.repository.findBySlug(slug);
    if (!event) throw new NotFoundException('Event not found');
    return this.enrichMoviePayload(event);
  }

  async getRelated(slug: string) {
    const current = await this.repository.findBySlug(slug);
    if (!current) throw new NotFoundException('Event not found');
    const related = await this.repository.findRelated(current.id, 6);
    return related.map((item) => this.enrichMoviePayload(item));
  }
}
