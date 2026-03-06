import { Injectable } from '@nestjs/common';
import { TicketCategoriesRepository } from './ticket-categories.repository';

@Injectable()
export class TicketCategoriesService {
  constructor(private readonly repository: TicketCategoriesRepository) {}

  healthCheck() {
    return { module: 'ticket-categories', status: 'ok' };
  }
}
