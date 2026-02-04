import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { OrdersService } from '../orders/orders.service';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from './payment-gateway.interface';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { FailPaymentDto } from './dto/fail-payment.dto';
import { StartPaymentDto } from './dto/start-payment.dto';
import {
  PAYMENT_VERIFICATION_QUEUE,
  PAYMENT_VERIFY_JOB,
} from '../../queues/payment-verification.queue';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @InjectQueue(PAYMENT_VERIFICATION_QUEUE) private readonly paymentQueue: Queue,
  ) {}

  healthCheck() {
    return { module: 'payments', status: 'ok' };
  }

  async startPayment(dto: StartPaymentDto) {
    const order = await this.ordersService.findOne(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const session = await this.gateway.startPayment(order.id, String(order.total));
    await this.paymentQueue.add(
      PAYMENT_VERIFY_JOB,
      { orderId: order.id },
      {
        delay: 5 * 60 * 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    return { orderId: order.id, state: order.state, ...session };
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    const result = await this.gateway.verifyPayment(dto.paymentId);
    if (!result.success) {
      await this.ordersService.expireOrder(dto.orderId, 'payment_verification_failed');
      return { success: false, state: 'EXPIRED' };
    }
    const order = await this.ordersService.confirmOrder(dto.orderId, result.transactionId);
    return { success: true, state: order.state, order };
  }

  async failPayment(dto: FailPaymentDto) {
    const order = await this.ordersService.expireOrder(dto.orderId, 'payment_failed');
    return { success: !!order, state: order?.state ?? 'EXPIRED' };
  }
}
