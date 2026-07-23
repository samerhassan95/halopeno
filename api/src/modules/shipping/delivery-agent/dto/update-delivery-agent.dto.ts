import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryAgentDto } from './create-delivery-agent.dto';

export class UpdateDeliveryAgentDto extends PartialType(CreateDeliveryAgentDto) {}
