import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  RESERVATION_EXPIRE_JOB,
  RESERVATION_EXPIRY_QUEUE,
  RESERVATION_SCAN_JOB,
  ReservationExpireJob,
} from '../queues/reservation-expiry.queue';
import { OrdersService } from '../modules/orders/orders.service';

@Processor(RESERVATION_EXPIRY_QUEUE)
export class ReservationExpiryWorker extends WorkerHost {
  private readonly logger = new Logger(ReservationExpiryWorker.name);

  constructor(private readonly ordersService: OrdersService) {
    super();
  }

  async process(job: Job<ReservationExpireJob>) {
    if (job.name === RESERVATION_SCAN_JOB || job.name.includes('reservation-scan-scheduler')) {
      const count = await this.ordersService.expireDueReservations();
      this.logger.log(`reservation scan completed: expired=${count}`);
      return { expired: count };
    }

    if (job.name === RESERVATION_EXPIRE_JOB && job.data?.orderId) {
      const expired = await this.ordersService.expireOrderByTimeout(job.data.orderId);
      this.logger.log(`reservation job processed: orderId=${job.data.orderId} expired=${expired}`);
      return { expired };
    }

    this.logger.warn(`unknown reservation job: ${job.name}`);
    return { ignored: true };
  }
}
