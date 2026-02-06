import { Injectable } from '@nestjs/common';
import { ProducersRepository } from './producers.repository';

@Injectable()
export class ProducersService {
  constructor(private readonly repository: ProducersRepository) {}

  healthCheck() {
    return { module: 'producers', status: 'ok' };
  }
}
