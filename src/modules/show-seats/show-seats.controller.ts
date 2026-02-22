import { Controller, Get, Param } from '@nestjs/common';
import { ShowSeatsService } from './show-seats.service';

@Controller('show-seats')
export class ShowSeatsController {
  constructor(private readonly service: ShowSeatsService) {}

  @Get('layout/:showId')
  getLayout(@Param('showId') showId: string) {
    return this.service.getLayout(showId);
  }
}
