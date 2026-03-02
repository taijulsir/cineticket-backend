import { Module } from '@nestjs/common';
import { StatesController } from './states.controller';
import { StatesRepository } from './states.repository';
import { StatesService } from './states.service';

@Module({
  controllers: [StatesController],
  providers: [StatesService, StatesRepository],
  exports: [StatesService],
})
export class StatesModule {}
