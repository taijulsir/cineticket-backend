import { Controller, Get } from '@nestjs/common';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly service: AdsService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
