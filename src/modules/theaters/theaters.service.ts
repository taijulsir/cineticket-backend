import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination } from '../../utils/pagination.util';
import { QueryTheatersDto } from './dto/query-theaters.dto';
import { TheatersRepository } from './theaters.repository';

@Injectable()
export class TheatersService {
  constructor(private readonly repository: TheatersRepository) {}

  async getAll(query: QueryTheatersDto) {
    const { skip, limit, page } = getPagination(query.page, query.limit);
    const where: Prisma.TheaterWhereInput = {
      deletedAt: null,
      isArchive: false,
      ...(query.cityId && { cityId: query.cityId }),
      ...(query.format && { formats: { has: query.format } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getBySlug(slug: string) {
    const theater = await this.repository.findBySlug(slug);
    if (!theater) throw new NotFoundException('Theater not found');
    return theater;
  }

  async getShows(theaterId: string) {
    return this.repository.findShows(theaterId);
  }

  healthCheck() {
    return { module: 'theaters', status: 'ok' };
  }
}
