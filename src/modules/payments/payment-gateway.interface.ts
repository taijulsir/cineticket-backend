export type PaymentSession = {
  provider: string;
  paymentId: string;
  checkoutUrl: string;
};

export type PaymentStartOptions = {
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export type PaymentVerificationResult = {
  success: boolean;
  transactionId: string;
};

export interface PaymentGateway {
  startPayment(orderId: string, amount: string, options?: PaymentStartOptions): Promise<PaymentSession>;
  verifyPayment(paymentId: string): Promise<PaymentVerificationResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
