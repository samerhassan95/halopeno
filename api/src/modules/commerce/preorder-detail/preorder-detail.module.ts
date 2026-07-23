import { Module } from '@nestjs/common';
import { PreorderDetailController } from './preorder-detail.controller';
import { PreorderDetailService } from './preorder-detail.service';

@Module({
  controllers: [PreorderDetailController],
  providers: [PreorderDetailService],
  exports: [PreorderDetailService],
})
export class PreorderDetailModule {}
