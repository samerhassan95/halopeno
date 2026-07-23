import { Module } from '@nestjs/common';
import { PushCampaignController } from './push-campaign.controller';
import { PushCampaignService } from './push-campaign.service';

@Module({
  controllers: [PushCampaignController],
  providers: [PushCampaignService],
  exports: [PushCampaignService],
})
export class PushCampaignModule {}
