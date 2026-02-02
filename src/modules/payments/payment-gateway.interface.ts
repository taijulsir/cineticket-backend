export type PaymentSession = {
  provider: string;
  paymentId: string;
  checkoutUrl: string;
};

export type PaymentVerificationResult = {
  success: boolean;
  transactionId: string;
};

export interface PaymentGateway {
  startPayment(orderId: string, amount: string): Promise<PaymentSession>;
  verifyPayment(paymentId: string): Promise<PaymentVerificationResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
