import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../../utils/pagination.util';
import { QueryEventsDto } from './dto/query-events.dto';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  async getAll(query: QueryEventsDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      isArchive: false,
      ...(query.status && { status: query.status }),
    };
    const [data, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);
    return { data, meta: { page, limit, total } };
  }
}
