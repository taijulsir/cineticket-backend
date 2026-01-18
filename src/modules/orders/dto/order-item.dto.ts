import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  seatId!: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}
