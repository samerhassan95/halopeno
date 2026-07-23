import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '@prisma/client';

export class CreateReturnDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizationNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["REQUESTED","APPROVED","REJECTED","RECEIVED","INSPECTED","COMPLETED"])
  status?: ReturnStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPartial?: boolean;
}
