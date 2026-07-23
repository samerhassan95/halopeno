import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAiGenerationLogDto {
  @ApiProperty()
  @IsString()
  feature!: string;

  @ApiPropertyOptional()
  @IsOptional()
  inputJson?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outputText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}
