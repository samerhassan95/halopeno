import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateStockItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  warehouseId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reserved?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  damaged?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  incoming?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  binLocation?: string;
}
