import { Injectable } from '@nestjs/common';
import { TheatersRepository } from './theaters.repository';

@Injectable()
export class TheatersService {
  constructor(private readonly repository: TheatersRepository) {}

  healthCheck() {
    return { module: 'theaters', status: 'ok' };
  }
}
