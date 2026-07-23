import { Module } from '@nestjs/common';
import { LoyaltyTransactionController } from './loyalty-transaction.controller';
import { LoyaltyTransactionService } from './loyalty-transaction.service';

@Module({
  controllers: [LoyaltyTransactionController],
  providers: [LoyaltyTransactionService],
  exports: [LoyaltyTransactionService],
})
export class LoyaltyTransactionModule {}
