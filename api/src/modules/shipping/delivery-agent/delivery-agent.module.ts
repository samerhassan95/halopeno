import { Module } from '@nestjs/common';
import { DeliveryAgentController } from './delivery-agent.controller';
import { DeliveryAgentService } from './delivery-agent.service';

@Module({
  controllers: [DeliveryAgentController],
  providers: [DeliveryAgentService],
  exports: [DeliveryAgentService],
})
export class DeliveryAgentModule {}
