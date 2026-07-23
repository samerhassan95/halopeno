import { Module } from '@nestjs/common';
import { TicketReplyController } from './ticket-reply.controller';
import { TicketReplyService } from './ticket-reply.service';

@Module({
  controllers: [TicketReplyController],
  providers: [TicketReplyService],
  exports: [TicketReplyService],
})
export class TicketReplyModule {}
