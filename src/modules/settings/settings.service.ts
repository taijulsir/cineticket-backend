import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  healthCheck() {
    return { module: 'settings', status: 'ok' };
  }
}
