import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerGroupService } from './customer-group.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers/customer-groups')
export class CustomerGroupController {
  constructor(private readonly service: CustomerGroupService) {}

  @Get()
  @ApiOperation({ summary: 'List customer-groups with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer-group by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer-group' })
  create(@Body() dto: CreateCustomerGroupDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing customer-group' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer-group' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
