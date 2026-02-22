import { Module } from '@nestjs/common';
import { ShowSeatsController } from './show-seats.controller';
import { ShowSeatsRepository } from './show-seats.repository';
import { ShowSeatsService } from './show-seats.service';

@Module({
  controllers: [ShowSeatsController],
  providers: [ShowSeatsService, ShowSeatsRepository],
  exports: [ShowSeatsService],
})
export class ShowSeatsModule {}
