import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateWebhookLogDto {
  @ApiProperty()
  @IsString()
  webhookId!: string;

  @ApiProperty()
  @IsString()
  event!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseBody?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  attempt?: number;
}
