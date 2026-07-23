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
import { PurchaseOrderItemService } from './purchase-order-item.service';
import { CreatePurchaseOrderItemDto } from './dto/create-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Purchasing')
@ApiBearerAuth()
@Controller('purchasing/purchase-order-items')
export class PurchaseOrderItemController {
  constructor(private readonly service: PurchaseOrderItemService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase-order-items with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single purchase-order-item by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase-order-item' })
  create(@Body() dto: CreatePurchaseOrderItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing purchase-order-item' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase-order-item' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
