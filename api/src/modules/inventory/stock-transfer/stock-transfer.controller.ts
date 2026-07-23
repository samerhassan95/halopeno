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
import { StockTransferService } from './stock-transfer.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/stock-transfers')
export class StockTransferController {
  constructor(private readonly service: StockTransferService) {}

  @Get()
  @ApiOperation({ summary: 'List stock-transfers with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single stock-transfer by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock-transfer' })
  create(@Body() dto: CreateStockTransferDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing stock-transfer' })
  update(@Param('id') id: string, @Body() dto: UpdateStockTransferDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock-transfer' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
