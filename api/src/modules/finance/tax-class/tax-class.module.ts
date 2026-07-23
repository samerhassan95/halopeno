import { Module } from '@nestjs/common';
import { TaxClassController } from './tax-class.controller';
import { TaxClassService } from './tax-class.service';

@Module({
  controllers: [TaxClassController],
  providers: [TaxClassService],
  exports: [TaxClassService],
})
export class TaxClassModule {}
