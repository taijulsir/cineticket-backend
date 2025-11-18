import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RESERVATION_EXPIRY_QUEUE } from '../../queues/reservation-expiry.queue';
import { PAYMENT_VERIFICATION_QUEUE } from '../../queues/payment-verification.queue';

@Injectable()
class QueueBootstrapService implements OnModuleInit {
  constructor(@InjectQueue(RESERVATION_EXPIRY_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler('reservation-scan-scheduler', {
      every: 60_000,
    });
  }
}

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379' },
      }),
    }),
    BullModule.registerQueue(
      {
        name: RESERVATION_EXPIRY_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
      {
        name: PAYMENT_VERIFICATION_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
    ),
  ],
  providers: [QueueBootstrapService],
  exports: [BullModule],
})
export class QueueModule {}
