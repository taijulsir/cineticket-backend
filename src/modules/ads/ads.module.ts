import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsRepository } from './ads.repository';
import { AdsService } from './ads.service';

@Module({
  controllers: [AdsController],
  providers: [AdsService, AdsRepository],
  exports: [AdsService],
})
export class AdsModule {}
