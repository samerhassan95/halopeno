import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccountingEntryDto {
  @ApiProperty()
  @IsString()
  account!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  debit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  credit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  postedAt?: string;
}
