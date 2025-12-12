import { Injectable } from '@nestjs/common';
import { CitiesRepository } from './cities.repository';

@Injectable()
export class CitiesService {
  constructor(private readonly repository: CitiesRepository) {}

  healthCheck() {
    return { module: 'cities', status: 'ok' };
  }
}
