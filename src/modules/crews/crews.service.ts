import { Injectable } from '@nestjs/common';
import { CrewsRepository } from './crews.repository';

@Injectable()
export class CrewsService {
  constructor(private readonly repository: CrewsRepository) {}

  healthCheck() {
    return { module: 'crews', status: 'ok' };
  }
}
