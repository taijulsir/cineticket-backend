import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PAYMENT_VERIFICATION_QUEUE } from '../../queues/payment-verification.queue';
import { OrdersModule } from '../orders/orders.module';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule, BullModule.registerQueue({ name: PAYMENT_VERIFICATION_QUEUE })],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    MockPaymentGatewayService,
    { provide: PAYMENT_GATEWAY, useExisting: MockPaymentGatewayService },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
