import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAffiliateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsString()
  referralCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
