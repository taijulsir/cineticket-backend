import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  PaymentStartOptions,
  PaymentSession,
  PaymentVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class MockPaymentGatewayService implements PaymentGateway {
  async startPayment(orderId: string, amount: string, options?: PaymentStartOptions): Promise<PaymentSession> {
    const paymentId = `mock_${orderId.slice(0, 8)}_${Date.now()}`;
    const fallbackUrl = `https://mock-payments.local/checkout/${paymentId}?amount=${amount}`;
    const successUrl = options?.successUrl?.replace('{CHECKOUT_SESSION_ID}', paymentId);
    return {
      provider: 'mock',
      paymentId,
      checkoutUrl: successUrl ?? fallbackUrl,
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    return { success: paymentId.startsWith('mock_'), transactionId: `txn_${paymentId}` };
  }
}
