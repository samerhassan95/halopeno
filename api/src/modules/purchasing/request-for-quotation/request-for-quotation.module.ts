import { Module } from '@nestjs/common';
import { RequestForQuotationController } from './request-for-quotation.controller';
import { RequestForQuotationService } from './request-for-quotation.service';

@Module({
  controllers: [RequestForQuotationController],
  providers: [RequestForQuotationService],
  exports: [RequestForQuotationService],
})
export class RequestForQuotationModule {}
