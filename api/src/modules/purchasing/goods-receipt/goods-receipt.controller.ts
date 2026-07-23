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
import { GoodsReceiptService } from './goods-receipt.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Purchasing')
@ApiBearerAuth()
@Controller('purchasing/goods-receipts')
export class GoodsReceiptController {
  constructor(private readonly service: GoodsReceiptService) {}

  @Get()
  @ApiOperation({ summary: 'List goods-receipts with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single goods-receipt by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goods-receipt' })
  create(@Body() dto: CreateGoodsReceiptDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing goods-receipt' })
  update(@Param('id') id: string, @Body() dto: UpdateGoodsReceiptDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goods-receipt' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
