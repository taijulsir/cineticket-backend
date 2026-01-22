import { CreateOrderDto } from '../dto/create-order.dto';

export type CreateOrderPayload = {
  dto: CreateOrderDto;
  orderCode: string;
  now: Date;
};
