import { Module } from '@nestjs/common';
import { AuctionDetailController } from './auction-detail.controller';
import { AuctionDetailService } from './auction-detail.service';

@Module({
  controllers: [AuctionDetailController],
  providers: [AuctionDetailService],
  exports: [AuctionDetailService],
})
export class AuctionDetailModule {}
