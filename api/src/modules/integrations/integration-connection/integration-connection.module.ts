import { Module } from '@nestjs/common';
import { IntegrationConnectionController } from './integration-connection.controller';
import { IntegrationConnectionService } from './integration-connection.service';

@Module({
  controllers: [IntegrationConnectionController],
  providers: [IntegrationConnectionService],
  exports: [IntegrationConnectionService],
})
export class IntegrationConnectionModule {}
