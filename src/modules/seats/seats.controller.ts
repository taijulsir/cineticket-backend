import { Controller, Get } from '@nestjs/common';
import { SeatsService } from './seats.service';

@Controller('seats')
export class SeatsController {
  constructor(private readonly service: SeatsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
