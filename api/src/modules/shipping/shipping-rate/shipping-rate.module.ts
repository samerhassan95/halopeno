import { Module } from '@nestjs/common';
import { ShippingRateController } from './shipping-rate.controller';
import { ShippingRateService } from './shipping-rate.service';

@Module({
  controllers: [ShippingRateController],
  providers: [ShippingRateService],
  exports: [ShippingRateService],
})
export class ShippingRateModule {}
