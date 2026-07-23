import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  method!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PENDING","AUTHORIZED","PAID","PARTIALLY_PAID","FAILED","VOIDED","REFUNDED","PARTIALLY_REFUNDED"])
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gatewayFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
