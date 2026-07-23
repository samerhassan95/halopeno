import { PartialType } from '@nestjs/swagger';
import { CreateEmailCampaignDto } from './create-email-campaign.dto';

export class UpdateEmailCampaignDto extends PartialType(CreateEmailCampaignDto) {}
