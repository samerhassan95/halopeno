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
import { StockItemService } from './stock-item.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/stock-items')
export class StockItemController {
  constructor(private readonly service: StockItemService) {}

  @Get()
  @ApiOperation({ summary: 'List stock-items with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single stock-item by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock-item' })
  create(@Body() dto: CreateStockItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing stock-item' })
  update(@Param('id') id: string, @Body() dto: UpdateStockItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock-item' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
