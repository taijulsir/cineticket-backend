import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ApplyPromoCodeDto {
  @ApiProperty()
  @IsString()
  promoCode!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice!: number;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  selectedSeats?: Array<{ price?: number }>;
}
