import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartPaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;
}
