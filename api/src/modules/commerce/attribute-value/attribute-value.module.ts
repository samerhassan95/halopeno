import { Module } from '@nestjs/common';
import { AttributeValueController } from './attribute-value.controller';
import { AttributeValueService } from './attribute-value.service';

@Module({
  controllers: [AttributeValueController],
  providers: [AttributeValueService],
  exports: [AttributeValueService],
})
export class AttributeValueModule {}
