import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PurchaseOrderStatus } from '@prisma/client';

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  poNumber!: string;

  @ApiProperty()
  @IsString()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["DRAFT","PENDING_APPROVAL","APPROVED","ORDERED","PARTIALLY_RECEIVED","RECEIVED","CANCELLED"])
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedAt?: string;
}
