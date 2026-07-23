import { Module } from '@nestjs/common';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';

@Module({
  controllers: [PopupController],
  providers: [PopupService],
  exports: [PopupService],
})
export class PopupModule {}
