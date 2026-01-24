import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FailPaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;
}
