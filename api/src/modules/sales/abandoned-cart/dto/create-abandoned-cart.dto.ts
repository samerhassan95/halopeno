import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAbandonedCartDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestEmail?: string;

  @ApiProperty()
  @IsNumber()
  cartValue!: number;

  @ApiProperty()
  @IsDefined()
  itemsJson!: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastActivity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recoveryStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  recoveredRevenue?: number;
}
