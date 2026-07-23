import { Module } from '@nestjs/common';
import { OtpRequestController } from './otp-request.controller';
import { OtpRequestService } from './otp-request.service';

@Module({
  controllers: [OtpRequestController],
  providers: [OtpRequestService],
  exports: [OtpRequestService],
})
export class OtpRequestModule {}
