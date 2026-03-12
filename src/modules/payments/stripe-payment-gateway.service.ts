import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentGateway,
  PaymentSession,
  PaymentStartOptions,
  PaymentVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class StripePaymentGatewayService implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(apiKey ?? '', { apiVersion: '2025-08-27.basil' });
  }

  async startPayment(orderId: string, amount: string, options?: PaymentStartOptions): Promise<PaymentSession> {
    const unitAmount = Math.max(1, Math.round(Number(amount) * 100));
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: options?.successUrl ?? `${this.frontendBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: options?.cancelUrl ?? `${this.frontendBaseUrl}/payment-cancel`,
      metadata: { orderId, ...(options?.metadata ?? {}) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            product_data: { name: `CineTicket Order ${orderId.slice(0, 8)}` },
            unit_amount: unitAmount,
          },
        },
      ],
    });
    return { provider: 'stripe', paymentId: session.id, checkoutUrl: session.url ?? '' };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    const session = await this.stripe.checkout.sessions.retrieve(paymentId);
    const success = session.payment_status === 'paid' && session.status === 'complete';
    return { success, transactionId: String(session.payment_intent ?? session.id) };
  }

  private get frontendBaseUrl() {
    return this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }
}
