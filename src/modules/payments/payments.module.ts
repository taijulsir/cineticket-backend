import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_VERIFICATION_QUEUE } from '../../queues/payment-verification.queue';
import { OrdersModule } from '../orders/orders.module';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { StripePaymentGatewayService } from './stripe-payment-gateway.service';

@Module({
  imports: [OrdersModule, BullModule.registerQueue({ name: PAYMENT_VERIFICATION_QUEUE })],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    MockPaymentGatewayService,
    StripePaymentGatewayService,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, MockPaymentGatewayService, StripePaymentGatewayService],
      useFactory: (
        config: ConfigService,
        mockGateway: MockPaymentGatewayService,
        stripeGateway: StripePaymentGatewayService,
      ) => (config.get<string>('PAYMENT_PROVIDER') === 'stripe' ? stripeGateway : mockGateway),
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
