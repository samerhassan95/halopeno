import { Module } from '@nestjs/common';
import { SmsCampaignController } from './sms-campaign.controller';
import { SmsCampaignService } from './sms-campaign.service';

@Module({
  controllers: [SmsCampaignController],
  providers: [SmsCampaignService],
  exports: [SmsCampaignService],
})
export class SmsCampaignModule {}
