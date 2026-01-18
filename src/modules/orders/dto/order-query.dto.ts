import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Min } from 'class-validator';

export class OrderQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
