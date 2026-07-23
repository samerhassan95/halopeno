import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOtpRequestDto {
  @ApiProperty()
  @IsString()
  useCase!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty()
  @IsString()
  provider!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  attempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  verifiedAt?: string;
}
