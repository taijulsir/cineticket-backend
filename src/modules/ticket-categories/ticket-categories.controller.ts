import { Controller, Get } from '@nestjs/common';
import { TicketCategoriesService } from './ticket-categories.service';

@Controller('ticket-categories')
export class TicketCategoriesController {
  constructor(private readonly service: TicketCategoriesService) {}

  @Get('health')
  health() {
    return this.service.healthCheck();
  }
}
