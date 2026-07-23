import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateCommissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PERCENTAGE","FIXED","TIERED"])
  type?: CommissionType;

  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}
