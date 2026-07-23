import { Module } from '@nestjs/common';
import { NotificationTemplateController } from './notification-template.controller';
import { NotificationTemplateService } from './notification-template.service';

@Module({
  controllers: [NotificationTemplateController],
  providers: [NotificationTemplateService],
  exports: [NotificationTemplateService],
})
export class NotificationTemplateModule {}
