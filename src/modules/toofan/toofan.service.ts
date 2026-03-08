import { Injectable } from '@nestjs/common';
import { ToofanRepository } from './toofan.repository';

@Injectable()
export class ToofanService {
  constructor(private readonly repository: ToofanRepository) {}

  healthCheck() {
    return { module: 'toofan', status: 'ok' };
  }
}
