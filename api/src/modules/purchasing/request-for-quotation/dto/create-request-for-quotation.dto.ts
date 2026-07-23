import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreateRequestForQuotationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty()
  @IsDefined()
  itemsJson!: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
