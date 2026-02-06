import { Module } from '@nestjs/common';
import { ProducersController } from './producers.controller';
import { ProducersRepository } from './producers.repository';
import { ProducersService } from './producers.service';

@Module({
  controllers: [ProducersController],
  providers: [ProducersService, ProducersRepository],
  exports: [ProducersService],
})
export class ProducersModule {}
