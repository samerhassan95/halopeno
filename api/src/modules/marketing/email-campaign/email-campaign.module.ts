import { Module } from '@nestjs/common';
import { EmailCampaignController } from './email-campaign.controller';
import { EmailCampaignService } from './email-campaign.service';

@Module({
  controllers: [EmailCampaignController],
  providers: [EmailCampaignService],
  exports: [EmailCampaignService],
})
export class EmailCampaignModule {}
