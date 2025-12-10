import { Controller, Get } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
