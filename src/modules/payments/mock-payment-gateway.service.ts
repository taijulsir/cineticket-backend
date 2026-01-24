import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  PaymentSession,
  PaymentVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class MockPaymentGatewayService implements PaymentGateway {
  async startPayment(orderId: string, amount: string): Promise<PaymentSession> {
    const paymentId = `mock_${orderId.slice(0, 8)}_${Date.now()}`;
    return {
      provider: 'mock',
      paymentId,
      checkoutUrl: `https://mock-payments.local/checkout/${paymentId}?amount=${amount}`,
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    return { success: paymentId.startsWith('mock_'), transactionId: `txn_${paymentId}` };
  }
}
