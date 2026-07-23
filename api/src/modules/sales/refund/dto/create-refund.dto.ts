import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class CreateRefundDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PENDING","APPROVED","REJECTED","PROCESSED"])
  status?: RefundStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  processedAt?: string;
}
