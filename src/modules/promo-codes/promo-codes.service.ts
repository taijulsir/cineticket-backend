import { Injectable } from '@nestjs/common';
import { PromoCodesRepository } from './promo-codes.repository';

@Injectable()
export class PromoCodesService {
  constructor(private readonly repository: PromoCodesRepository) {}

  healthCheck() {
    return { module: 'promo-codes', status: 'ok' };
  }
}
