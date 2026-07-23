import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAffiliateReferralDto {
  @ApiProperty()
  @IsString()
  affiliateId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clickedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  convertedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commission?: number;
}
