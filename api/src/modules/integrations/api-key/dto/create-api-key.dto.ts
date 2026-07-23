import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  keyPrefix!: string;

  @ApiProperty()
  @IsString()
  keyHash!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastUsedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  revoked?: boolean;
}
