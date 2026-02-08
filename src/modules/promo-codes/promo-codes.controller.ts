import { Controller, Get } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly service: PromoCodesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
