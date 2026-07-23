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
import { StockCountService } from './stock-count.service';
import { CreateStockCountDto } from './dto/create-stock-count.dto';
import { UpdateStockCountDto } from './dto/update-stock-count.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/stock-counts')
export class StockCountController {
  constructor(private readonly service: StockCountService) {}

  @Get()
  @ApiOperation({ summary: 'List stock-counts with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single stock-count by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock-count' })
  create(@Body() dto: CreateStockCountDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing stock-count' })
  update(@Param('id') id: string, @Body() dto: UpdateStockCountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock-count' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
