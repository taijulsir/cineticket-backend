import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class StartPaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}
