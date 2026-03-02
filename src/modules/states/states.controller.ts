import { Controller, Get } from '@nestjs/common';
import { StatesService } from './states.service';

@Controller('states')
export class StatesController {
  constructor(private readonly service: StatesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
