import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountType, CouponScope } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PERCENTAGE","FIXED","FREE_SHIPPING"])
  discountType?: DiscountType;

  @ApiProperty()
  @IsNumber()
  discountValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["ALL","PRODUCT","CATEGORY","BRAND","SELLER","CUSTOMER_GROUP"])
  scope?: CouponScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeRefId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  perCustomerLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  usedCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
