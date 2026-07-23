import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @ApiProperty()
  @IsString()
  purchaseOrderId!: string;

  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsInt()
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  unitCost!: number;
}
