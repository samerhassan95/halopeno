import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["EMAIL","SMS","WHATSAPP","PUSH","IN_APP"])
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["QUEUED","SENT","FAILED","READ","UNREAD"])
  status?: NotificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;
}
