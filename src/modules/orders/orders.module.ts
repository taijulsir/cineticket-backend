import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RESERVATION_EXPIRY_QUEUE } from '../../queues/reservation-expiry.queue';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [BullModule.registerQueue({ name: RESERVATION_EXPIRY_QUEUE })],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
