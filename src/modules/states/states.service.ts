import { Injectable } from '@nestjs/common';
import { StatesRepository } from './states.repository';

@Injectable()
export class StatesService {
  constructor(private readonly repository: StatesRepository) {}

  healthCheck() {
    return { module: 'states', status: 'ok' };
  }
}
