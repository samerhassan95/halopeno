import { Module } from '@nestjs/common';
import { PickupLocationController } from './pickup-location.controller';
import { PickupLocationService } from './pickup-location.service';

@Module({
  controllers: [PickupLocationController],
  providers: [PickupLocationService],
  exports: [PickupLocationService],
})
export class PickupLocationModule {}
