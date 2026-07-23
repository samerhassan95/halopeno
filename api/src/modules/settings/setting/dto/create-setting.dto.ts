import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty()
  @IsString()
  group!: string;

  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsDefined()
  value!: any;
}
