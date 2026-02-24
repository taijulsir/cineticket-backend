import { Injectable, NotFoundException } from '@nestjs/common';
import { SeatStatus } from '@prisma/client';
import { ShowSeatsRepository } from './show-seats.repository';

@Injectable()
export class ShowSeatsService {
  constructor(private readonly repository: ShowSeatsRepository) {}

  async getLayout(showId: string) {
    const show = await this.repository.getShowWithHall(showId);
    if (!show) throw new NotFoundException('Show not found');

    const rows = await this.repository.getHallLayoutWithShowSeats(show.hallId, showId);
    return rows.map((hallSeat) => {
      const showSeat = hallSeat.showSeats[0];
      const isReservedExpired =
        showSeat?.status === SeatStatus.RESERVED && !!showSeat.reservedUntil && showSeat.reservedUntil < new Date();

      return {
        hallSeatId: hallSeat.id,
        row: hallSeat.row,
        column: hallSeat.column,
        seatName: hallSeat.seatName,
        seatType: hallSeat.seatType,
        showSeatId: showSeat?.id ?? null,
        status: isReservedExpired ? SeatStatus.AVAILABLE : (showSeat?.status ?? SeatStatus.AVAILABLE),
        reservedUntil: isReservedExpired ? null : (showSeat?.reservedUntil ?? null),
      };
    });
  }
}
