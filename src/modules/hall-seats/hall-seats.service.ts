import { Injectable } from '@nestjs/common';
import { HallSeatsRepository } from './hall-seats.repository';

@Injectable()
export class HallSeatsService {
  constructor(private readonly repository: HallSeatsRepository) {}

  healthCheck() {
    return { module: 'hall-seats', status: 'ok' };
  }
}
