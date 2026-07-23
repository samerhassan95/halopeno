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
import { ShippingRateService } from './shipping-rate.service';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import { UpdateShippingRateDto } from './dto/update-shipping-rate.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping/shipping-rates')
export class ShippingRateController {
  constructor(private readonly service: ShippingRateService) {}

  @Get()
  @ApiOperation({ summary: 'List shipping-rates with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shipping-rate by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shipping-rate' })
  create(@Body() dto: CreateShippingRateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing shipping-rate' })
  update(@Param('id') id: string, @Body() dto: UpdateShippingRateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping-rate' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
