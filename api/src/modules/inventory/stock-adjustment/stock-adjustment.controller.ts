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
import { StockAdjustmentService } from './stock-adjustment.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/stock-adjustments')
export class StockAdjustmentController {
  constructor(private readonly service: StockAdjustmentService) {}

  @Get()
  @ApiOperation({ summary: 'List stock-adjustments with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single stock-adjustment by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock-adjustment' })
  create(@Body() dto: CreateStockAdjustmentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing stock-adjustment' })
  update(@Param('id') id: string, @Body() dto: UpdateStockAdjustmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock-adjustment' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
