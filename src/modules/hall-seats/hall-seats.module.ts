import { Module } from '@nestjs/common';
import { HallSeatsController } from './hall-seats.controller';
import { HallSeatsRepository } from './hall-seats.repository';
import { HallSeatsService } from './hall-seats.service';

@Module({
  controllers: [HallSeatsController],
  providers: [HallSeatsService, HallSeatsRepository],
  exports: [HallSeatsService],
})
export class HallSeatsModule {}
