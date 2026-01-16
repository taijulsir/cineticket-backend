import { Module } from '@nestjs/common';
import { HeroSlidersController } from './hero-sliders.controller';
import { HeroSlidersRepository } from './hero-sliders.repository';
import { HeroSlidersService } from './hero-sliders.service';

@Module({
  controllers: [HeroSlidersController],
  providers: [HeroSlidersService, HeroSlidersRepository],
  exports: [HeroSlidersService],
})
export class HeroSlidersModule {}
