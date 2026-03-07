import { Module } from '@nestjs/common';
import { ToofanController } from './toofan.controller';
import { ToofanRepository } from './toofan.repository';
import { ToofanService } from './toofan.service';

@Module({
  controllers: [ToofanController],
  providers: [ToofanService, ToofanRepository],
  exports: [ToofanService],
})
export class ToofanModule {}
