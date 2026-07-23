import { Module } from '@nestjs/common';
import { ShippingZoneController } from './shipping-zone.controller';
import { ShippingZoneService } from './shipping-zone.service';

@Module({
  controllers: [ShippingZoneController],
  providers: [ShippingZoneService],
  exports: [ShippingZoneService],
})
export class ShippingZoneModule {}
