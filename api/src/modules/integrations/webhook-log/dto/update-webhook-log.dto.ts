import { PartialType } from '@nestjs/swagger';
import { CreateWebhookLogDto } from './create-webhook-log.dto';

export class UpdateWebhookLogDto extends PartialType(CreateWebhookLogDto) {}
