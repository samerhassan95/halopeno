import { Module } from '@nestjs/common';
import { SavedReportController } from './saved-report.controller';
import { SavedReportService } from './saved-report.service';

@Module({
  controllers: [SavedReportController],
  providers: [SavedReportService],
  exports: [SavedReportService],
})
export class SavedReportModule {}
