import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  showId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  promoCodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+61400111222' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiProperty({ example: 125 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'txn_1234' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  ticketItems!: OrderItemDto[];
}
