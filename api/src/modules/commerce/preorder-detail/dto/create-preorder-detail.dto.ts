import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePreorderDetailDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsDateString()
  startAt!: string;

  @ApiProperty()
  @IsDateString()
  endAt!: string;

  @ApiProperty()
  @IsDateString()
  expectedAvailable!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maxQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFullPayment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
