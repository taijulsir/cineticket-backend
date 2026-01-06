import { Controller, Get } from '@nestjs/common';
import { HallSeatsService } from './hall-seats.service';

@Controller('hall-seats')
export class HallSeatsController {
  constructor(private readonly service: HallSeatsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
