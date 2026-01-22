export type OrderPublic = {
  id: string;
  orderCode: string;
  eventId: string;
  showId: string;
  customerId: string | null;
  total: string;
  discount: string | null;
  createdAt: Date;
};
