import { Module } from '@nestjs/common';
import { CustomerGroupController } from './customer-group.controller';
import { CustomerGroupService } from './customer-group.service';

@Module({
  controllers: [CustomerGroupController],
  providers: [CustomerGroupService],
  exports: [CustomerGroupService],
})
export class CustomerGroupModule {}
