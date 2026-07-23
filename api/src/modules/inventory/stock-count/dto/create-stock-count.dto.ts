import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateStockCountDto {
  @ApiProperty()
  @IsString()
  warehouseId!: string;

  @ApiProperty()
  @IsString()
  reference!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countedBy?: string;
}
