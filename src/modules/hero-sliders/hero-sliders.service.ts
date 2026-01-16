import { Injectable } from '@nestjs/common';
import { HeroSlidersRepository } from './hero-sliders.repository';

@Injectable()
export class HeroSlidersService {
  constructor(private readonly repository: HeroSlidersRepository) {}

  healthCheck() {
    return { module: 'hero-sliders', status: 'ok' };
  }
}
