import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaxRateDto {
  @ApiProperty()
  @IsString()
  taxClassId!: string;

  @ApiProperty()
  @IsString()
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty()
  @IsNumber()
  rate!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompound?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInclusive?: boolean;
}
