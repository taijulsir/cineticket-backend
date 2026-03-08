export const RESERVATION_EXPIRY_QUEUE = 'reservation-expiry';
export const RESERVATION_EXPIRE_JOB = 'reservation-expire';
export const RESERVATION_SCAN_JOB = 'reservation-scan';

export type ReservationExpireJob = {
  orderId: string;
};
