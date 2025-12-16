import { Controller, Get } from '@nestjs/common';
import { CrewsService } from './crews.service';

@Controller('crews')
export class CrewsController {
  constructor(private readonly service: CrewsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
