import { Module } from '@nestjs/common';
import { TicketCategoriesController } from './ticket-categories.controller';
import { TicketCategoriesRepository } from './ticket-categories.repository';
import { TicketCategoriesService } from './ticket-categories.service';

@Module({
  controllers: [TicketCategoriesController],
  providers: [TicketCategoriesService, TicketCategoriesRepository],
  exports: [TicketCategoriesService],
})
export class TicketCategoriesModule {}
