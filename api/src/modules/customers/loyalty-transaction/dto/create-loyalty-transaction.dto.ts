import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLoyaltyTransactionDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsInt()
  points!: number;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
