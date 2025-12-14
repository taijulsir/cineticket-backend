import { Injectable } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';

@Injectable()
export class CountriesService {
  constructor(private readonly repository: CountriesRepository) {}

  healthCheck() {
    return { module: 'countries', status: 'ok' };
  }
}
