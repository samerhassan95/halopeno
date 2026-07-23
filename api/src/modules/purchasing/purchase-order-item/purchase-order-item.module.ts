import { Module } from '@nestjs/common';
import { PurchaseOrderItemController } from './purchase-order-item.controller';
import { PurchaseOrderItemService } from './purchase-order-item.service';

@Module({
  controllers: [PurchaseOrderItemController],
  providers: [PurchaseOrderItemService],
  exports: [PurchaseOrderItemService],
})
export class PurchaseOrderItemModule {}
