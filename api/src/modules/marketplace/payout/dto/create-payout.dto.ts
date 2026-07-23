import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { WithdrawalMethod, PayoutStatus } from '@prisma/client';

export class CreatePayoutDto {
  @ApiProperty()
  @IsString()
  sellerId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["BANK","WALLET","MANUAL"])
  method?: WithdrawalMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PENDING","APPROVED","REJECTED","PROCESSING","PAID","FAILED"])
  status?: PayoutStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
