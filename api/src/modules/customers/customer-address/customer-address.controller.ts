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
import { CustomerAddressService } from './customer-address.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers/customer-addresses')
export class CustomerAddressController {
  constructor(private readonly service: CustomerAddressService) {}

  @Get()
  @ApiOperation({ summary: 'List customer-addresses with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer-address by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer-address' })
  create(@Body() dto: CreateCustomerAddressDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing customer-address' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerAddressDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer-address' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
