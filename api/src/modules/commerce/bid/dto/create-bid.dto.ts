import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBidDto {
  @ApiProperty()
  @IsString()
  auctionId!: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAuto?: boolean;
}
