import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  invoiceNumber!: string;

  @ApiProperty()
  @IsNumber()
  total!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
