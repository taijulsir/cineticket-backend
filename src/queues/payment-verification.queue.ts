export const PAYMENT_VERIFICATION_QUEUE = 'payment-verification';
export const PAYMENT_VERIFY_JOB = 'payment-verify';

export type PaymentVerifyJob = {
  orderId: string;
};
