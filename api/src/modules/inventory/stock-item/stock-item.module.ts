import { Module } from '@nestjs/common';
import { StockItemController } from './stock-item.controller';
import { StockItemService } from './stock-item.service';

@Module({
  controllers: [StockItemController],
  providers: [StockItemService],
  exports: [StockItemService],
})
export class StockItemModule {}
