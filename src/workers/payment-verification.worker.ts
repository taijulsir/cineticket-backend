import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrdersService } from '../modules/orders/orders.service';
import {
  PAYMENT_VERIFICATION_QUEUE,
  PAYMENT_VERIFY_JOB,
  PaymentVerifyJob,
} from '../queues/payment-verification.queue';

@Processor(PAYMENT_VERIFICATION_QUEUE)
export class PaymentVerificationWorker extends WorkerHost {
  private readonly logger = new Logger(PaymentVerificationWorker.name);

  constructor(private readonly ordersService: OrdersService) {
    super();
  }

  async process(job: Job<PaymentVerifyJob>) {
    if (job.name !== PAYMENT_VERIFY_JOB || !job.data?.orderId) return { ignored: true };
    const expired = await this.ordersService.expireOrderByTimeout(job.data.orderId);
    this.logger.log(`payment verification timeout: orderId=${job.data.orderId} expired=${expired}`);
    return { expired };
  }
}
