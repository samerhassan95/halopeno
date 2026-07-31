import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ProductType, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["SIMPLE","VARIABLE","DIGITAL","DOWNLOADABLE","SUBSCRIPTION","BUNDLE","COMPOSITE","CONFIGURABLE","GIFT_CARD","SERVICE","RENTAL","AUCTION","PREORDER","WHOLESALE","MADE_TO_ORDER"])
  type?: ProductType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["DRAFT","PENDING_REVIEW","APPROVED","PUBLISHED","REJECTED","ARCHIVED","OUT_OF_STOCK","DISABLED"])
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warrantyInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  returnEligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingClass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxClassId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wholesalePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  wholesaleConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  digitalConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reservedStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reviewCount?: number;
}
