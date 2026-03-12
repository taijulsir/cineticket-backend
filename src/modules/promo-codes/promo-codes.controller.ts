import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApplyPromoCodeDto } from './dto';
import { PromoCodesService } from './promo-codes.service';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly service: PromoCodesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }

  @Get('offers')
  offers() {
    return this.service.listOffers();
  }

  @Post('apply')
  apply(@Body() dto: ApplyPromoCodeDto) {
    return this.service.applyPromoCode(dto);
  }
}
