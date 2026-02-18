import { Injectable } from '@nestjs/common';
import { SeatsRepository } from './seats.repository';

@Injectable()
export class SeatsService {
  constructor(private readonly repository: SeatsRepository) {}

  healthCheck() {
    return { module: 'seats', status: 'ok' };
  }
}
