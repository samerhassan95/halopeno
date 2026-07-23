import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsString()
  warehouseId!: string;

  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsInt()
  quantity!: number;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["RECEIPT","ISSUE","TRANSFER","ADJUSTMENT","COUNT","RETURN","DAMAGE","WRITE_OFF"])
  type?: StockMovementType;
}
