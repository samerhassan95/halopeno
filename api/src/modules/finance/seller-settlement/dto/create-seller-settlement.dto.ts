import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSellerSettlementDto {
  @ApiProperty()
  @IsString()
  sellerId!: string;

  @ApiProperty()
  @IsDateString()
  periodStart!: string;

  @ApiProperty()
  @IsDateString()
  periodEnd!: string;

  @ApiProperty()
  @IsNumber()
  grossSales!: number;

  @ApiProperty()
  @IsNumber()
  commission!: number;

  @ApiProperty()
  @IsNumber()
  netPayable!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
