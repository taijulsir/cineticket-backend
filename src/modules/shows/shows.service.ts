import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SeatStatus } from '@prisma/client';
import { getPagination } from '../../utils/pagination.util';
import { QueryShowsDto } from './dto/query-shows.dto';
import { ShowsRepository } from './shows.repository';

@Injectable()
export class ShowsService {
  constructor(private readonly repository: ShowsRepository) {}

  async getAll(query: QueryShowsDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where: Prisma.ShowWhereInput = {
      deletedAt: null,
      isArchive: false,
      ...(query.eventId && { eventId: query.eventId }),
      ...(query.date && { date: new Date(query.date) }),
    };
    const [data, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);
    return { data, meta: { page, limit, total } };
  }

  async getSeats(showId: string) {
    const show = await this.repository.findShow(showId);
    if (!show) throw new NotFoundException('Show not found');
    const seats = await this.repository.getLayout(show.hallId, showId);
    const now = new Date();
    return seats.map((seat) => {
      const showSeat = seat.showSeats[0];
      const expiredReserve =
        showSeat?.status === SeatStatus.RESERVED && !!showSeat.reservedUntil && showSeat.reservedUntil < now;
      return {
        hallSeatId: seat.id,
        seatName: seat.seatName,
        row: seat.row,
        column: seat.column,
        seatType: seat.seatType,
        showSeatId: showSeat?.id ?? null,
        status: expiredReserve ? SeatStatus.AVAILABLE : (showSeat?.status ?? SeatStatus.AVAILABLE),
        reservedUntil: expiredReserve ? null : (showSeat?.reservedUntil ?? null),
      };
    });
  }

  async getSeatMap(showId: string) {
    const layout = await this.getSeats(showId);
    const grouped = new Map<number, { row: string; seats: typeof layout }>();
    for (const seat of layout) {
      const key = seat.row;
      if (!grouped.has(key)) grouped.set(key, { row: this.toRowLabel(key), seats: [] });
      grouped.get(key)!.seats.push(seat);
    }
    return { rows: Array.from(grouped.values()) };
  }

  private toRowLabel(row: number) {
    return String.fromCharCode(64 + row);
  }
}
