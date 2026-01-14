import { Controller, Get } from '@nestjs/common';
import { HeroSlidersService } from './hero-sliders.service';

@Controller('hero-sliders')
export class HeroSlidersController {
  constructor(private readonly service: HeroSlidersService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
