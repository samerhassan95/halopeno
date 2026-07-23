import { PartialType } from '@nestjs/swagger';
import { CreateOtpRequestDto } from './create-otp-request.dto';

export class UpdateOtpRequestDto extends PartialType(CreateOtpRequestDto) {}
