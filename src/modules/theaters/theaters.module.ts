import { Module } from '@nestjs/common';
import { TheatersController } from './theaters.controller';
import { TheatersRepository } from './theaters.repository';
import { TheatersService } from './theaters.service';

@Module({
  controllers: [TheatersController],
  providers: [TheatersService, TheatersRepository],
  exports: [TheatersService],
})
export class TheatersModule {}
