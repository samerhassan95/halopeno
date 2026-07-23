import { PartialType } from '@nestjs/swagger';
import { CreateTicketReplyDto } from './create-ticket-reply.dto';

export class UpdateTicketReplyDto extends PartialType(CreateTicketReplyDto) {}
