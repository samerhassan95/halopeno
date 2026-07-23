import { Module } from '@nestjs/common';
import { AccountingEntryController } from './accounting-entry.controller';
import { AccountingEntryService } from './accounting-entry.service';

@Module({
  controllers: [AccountingEntryController],
  providers: [AccountingEntryService],
  exports: [AccountingEntryService],
})
export class AccountingEntryModule {}
