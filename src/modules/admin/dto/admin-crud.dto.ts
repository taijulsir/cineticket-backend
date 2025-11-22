import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  EventReleaseType,
  EventStatus,
  EventType,
  PromoDiscountType,
  SeatCategory,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAdminEventDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty({ enum: EventReleaseType }) @IsEnum(EventReleaseType) releaseType!: EventReleaseType;
  @ApiPropertyOptional() @IsOptional() @IsString() theatricalLink?: string;
  @ApiProperty() @IsString() trailerVideoLink!: string;
  @ApiProperty({ enum: EventStatus }) @IsEnum(EventStatus) status!: EventStatus;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() location!: string;
  @ApiProperty() @IsString() organizer!: string;
  @ApiProperty({ enum: EventType }) @IsEnum(EventType) type!: EventType;
  @ApiProperty() @IsString() cardImage!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() posterUrl?: string;
  @ApiProperty() @IsString() bannerImage!: string;
  @ApiProperty() @IsDateString() releaseDate!: string;
  @ApiProperty() @IsString() duration!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() eventCurrency?: string;
}

export class UpdateAdminEventDto extends PartialType(CreateAdminEventDto) {}

export class CreateAdminShowDto {
  @ApiProperty() @IsUUID() eventId!: string;
  @ApiProperty() @IsUUID() hallId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() cityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() stateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() countryId?: string;
  @ApiProperty() @IsUUID() theaterId!: string;
  @ApiProperty() @IsString() startTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;
  @ApiProperty() @IsDateString() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) totalSeats?: number;
}

export class UpdateAdminShowDto extends PartialType(CreateAdminShowDto) {}

export class CreateAdminTheaterDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsUUID() countryId!: string;
  @ApiProperty() @IsUUID() stateId!: string;
  @ApiProperty() @IsUUID() cityId!: string;
  @ApiProperty() @IsString() address!: string;
  @ApiProperty() @IsString() zipCode!: string;
}

export class CreateAdminHallDto {
  @ApiProperty() @IsUUID() theaterId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsInt() @Min(1) numberOfRows!: number;
  @ApiProperty() @IsInt() @Min(1) numberOfColumns!: number;
}

export class CreateAdminHallSeatDto {
  @ApiProperty() @IsUUID() hallId!: string;
  @ApiProperty() @IsInt() @Min(1) row!: number;
  @ApiProperty() @IsInt() @Min(1) column!: number;
  @ApiProperty() @IsString() seatId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seatName?: string;
  @ApiProperty({ enum: SeatCategory }) @IsEnum(SeatCategory) seatType!: SeatCategory;
}

export class UpdateAdminHallSeatDto {
  @ApiPropertyOptional() @IsOptional() @IsString() seatId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seatName?: string;
  @ApiPropertyOptional({ enum: SeatCategory }) @IsOptional() @IsEnum(SeatCategory) seatType?: SeatCategory;
}

export class CreateAdminPromoCodeDto {
  @ApiProperty() @IsString() promoCode!: string;
  @ApiProperty() @IsInt() @Min(1) maxlimit!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) usageCount?: number;
  @ApiProperty({ enum: PromoDiscountType }) @IsEnum(PromoDiscountType) discountType!: PromoDiscountType;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountAmount!: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAdminPromoCodeDto extends PartialType(CreateAdminPromoCodeDto) {}

export class CreateAdminHeroSliderDto {
  @ApiProperty() @IsUUID() eventId!: string;
  @ApiProperty() @IsInt() @Min(1) precedence!: number;
}

export class UpdateAdminHeroSliderDto extends PartialType(CreateAdminHeroSliderDto) {}

export class CreateAdminAdsDto {
  @ApiProperty() @IsString() poster!: string;
  @ApiProperty() @IsUrl() link!: string;
  @ApiProperty() @IsInt() @Min(1) precedence!: number;
}

export class UpdateAdminAdsDto extends PartialType(CreateAdminAdsDto) {}

export class CreateAdminSocialLinkDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsBoolean() visibility!: boolean;
  @ApiProperty() @IsUrl() link!: string;
}

export class UpdateAdminSocialLinkDto extends PartialType(CreateAdminSocialLinkDto) {}
