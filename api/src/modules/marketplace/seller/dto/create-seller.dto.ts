import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { SellerStatus } from '@prisma/client';

export class CreateSellerDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  shopName!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commissionPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["PENDING","APPROVED","REJECTED","SUSPENDED","REACTIVATED"])
  status?: SellerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  categoryLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  withdrawalLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  verifiedAt?: string;
}
