import { Injectable } from '@nestjs/common';
import { AdsRepository } from './ads.repository';

@Injectable()
export class AdsService {
  constructor(private readonly repository: AdsRepository) {}

  healthCheck() {
    return { module: 'ads', status: 'ok' };
  }
}
