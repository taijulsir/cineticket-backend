import { Controller, Get } from '@nestjs/common';
import { ProducersService } from './producers.service';

@Controller('producers')
export class ProducersController {
  constructor(private readonly service: ProducersService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
