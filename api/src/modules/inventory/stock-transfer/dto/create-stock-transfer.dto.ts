import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateStockTransferDto {
  @ApiProperty()
  @IsString()
  fromWarehouseId!: string;

  @ApiProperty()
  @IsString()
  toWarehouseId!: string;

  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsInt()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
