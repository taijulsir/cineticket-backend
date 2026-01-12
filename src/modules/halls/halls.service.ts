import { Injectable } from '@nestjs/common';
import { HallsRepository } from './halls.repository';

@Injectable()
export class HallsService {
  constructor(private readonly repository: HallsRepository) {}

  healthCheck() {
    return { module: 'halls', status: 'ok' };
  }
}
