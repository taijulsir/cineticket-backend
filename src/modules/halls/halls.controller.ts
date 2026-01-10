import { Controller, Get } from '@nestjs/common';
import { HallsService } from './halls.service';

@Controller('halls')
export class HallsController {
  constructor(private readonly service: HallsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
