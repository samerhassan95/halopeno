import { Module } from '@nestjs/common';
import { SellerSettlementController } from './seller-settlement.controller';
import { SellerSettlementService } from './seller-settlement.service';

@Module({
  controllers: [SellerSettlementController],
  providers: [SellerSettlementService],
  exports: [SellerSettlementService],
})
export class SellerSettlementModule {}
