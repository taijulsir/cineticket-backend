import { Module } from '@nestjs/common';
import { ShowsController } from './shows.controller';
import { ShowsRepository } from './shows.repository';
import { ShowsService } from './shows.service';

@Module({
  controllers: [ShowsController],
  providers: [ShowsService, ShowsRepository],
  exports: [ShowsService],
})
export class ShowsModule {}
