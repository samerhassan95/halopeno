import { PartialType } from '@nestjs/swagger';
import { CreateSmsCampaignDto } from './create-sms-campaign.dto';

export class UpdateSmsCampaignDto extends PartialType(CreateSmsCampaignDto) {}
