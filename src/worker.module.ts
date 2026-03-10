import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaymentVerificationWorker } from './workers/payment-verification.worker';
import { ReservationExpiryWorker } from './workers/reservation-expiry.worker';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    RedisModule,
    QueueModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [ReservationExpiryWorker, PaymentVerificationWorker],
})
export class WorkerModule {}
