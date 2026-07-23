import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAuctionDetailDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  startingBid!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  reservePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minIncrement?: number;

  @ApiProperty()
  @IsDateString()
  startAt!: string;

  @ApiProperty()
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoBidEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winnerCustomerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
