import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsInt()
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PENDING","APPROVED","REJECTED"])
  status?: ReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reply?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  helpfulCount?: number;
}
