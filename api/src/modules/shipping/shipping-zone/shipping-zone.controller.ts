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
import { ShippingZoneService } from './shipping-zone.service';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping/shipping-zones')
export class ShippingZoneController {
  constructor(private readonly service: ShippingZoneService) {}

  @Get()
  @ApiOperation({ summary: 'List shipping-zones with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shipping-zone by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shipping-zone' })
  create(@Body() dto: CreateShippingZoneDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing shipping-zone' })
  update(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping-zone' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
