import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class StorefrontOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateStorefrontOrderDto {
  @IsString()
  orderNumber!: string;

  @IsString()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StorefrontOrderItemDto)
  items!: StorefrontOrderItemDto[];

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsNumber()
  @Min(0)
  discountTotal!: number;

  @IsNumber()
  @Min(0)
  taxTotal!: number;

  @IsNumber()
  @Min(0)
  shippingTotal!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsString()
  deliveryMethod!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsIn(['en', 'ar'])
  preferredLanguage?: string;
}
