import { Module } from '@nestjs/common';
import { ProductBatchController } from './product-batch.controller';
import { ProductBatchService } from './product-batch.service';

@Module({
  controllers: [ProductBatchController],
  providers: [ProductBatchService],
  exports: [ProductBatchService],
})
export class ProductBatchModule {}
