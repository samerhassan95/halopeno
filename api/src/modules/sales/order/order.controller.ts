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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateStorefrontOrderDto } from './dto/create-storefront-order.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales/orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List orders with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Post('storefront')
  @ApiOperation({ summary: 'Create a storefront / POS checkout order (public)' })
  createStorefront(@Body() dto: CreateStorefrontOrderDto) {
    return this.service.createFromStorefront(dto);
  }

  @Public()
  @Get('tracking/:orderNumber')
  @ApiOperation({ summary: 'Public order tracking by order number' })
  track(@Param('orderNumber') orderNumber: string) {
    return this.service.findTrackingByOrderNumber(orderNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing order' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a order' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
