import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreatePurchaseRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiProperty()
  @IsDefined()
  itemsJson!: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
