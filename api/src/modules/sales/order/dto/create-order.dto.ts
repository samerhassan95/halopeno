import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderChannel, OrderSource, OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  orderNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["IN_HOUSE","SELLER"])
  channel?: OrderChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["WEBSITE","MOBILE_APP","MARKETPLACE","POS","MANUAL","SOCIAL","API","SUBSCRIPTION","WHOLESALE","PREORDER"])
  source?: OrderSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["DRAFT","PENDING","CONFIRMED","PROCESSING","READY_FOR_SHIPMENT","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","COMPLETED","CANCELLED","RETURNED","PARTIALLY_RETURNED","REFUNDED","PARTIALLY_REFUNDED","FAILED"])
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shippingTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paymentFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  billingAddress?: any;

  @ApiPropertyOptional()
  @IsOptional()
  shippingAddress?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}
