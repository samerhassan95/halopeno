import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class CreateSupportTicketDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["LOW","MEDIUM","HIGH","URGENT"])
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["OPEN","IN_PROGRESS","RESOLVED","CLOSED"])
  status?: TicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  slaDueAt?: string;
}
