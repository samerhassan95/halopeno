import { Module } from '@nestjs/common';
import { FlashDealController } from './flash-deal.controller';
import { FlashDealService } from './flash-deal.service';

@Module({
  controllers: [FlashDealController],
  providers: [FlashDealService],
  exports: [FlashDealService],
})
export class FlashDealModule {}
