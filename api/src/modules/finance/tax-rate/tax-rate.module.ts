import { Module } from '@nestjs/common';
import { TaxRateController } from './tax-rate.controller';
import { TaxRateService } from './tax-rate.service';

@Module({
  controllers: [TaxRateController],
  providers: [TaxRateService],
  exports: [TaxRateService],
})
export class TaxRateModule {}
