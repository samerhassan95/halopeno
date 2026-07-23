import { Module } from '@nestjs/common';
import { IntegrationsSummaryController } from './integrations-summary.controller';
import { IntegrationsSummaryService } from './integrations-summary.service';

@Module({
  controllers: [IntegrationsSummaryController],
  providers: [IntegrationsSummaryService],
})
export class IntegrationsSummaryModule {}
