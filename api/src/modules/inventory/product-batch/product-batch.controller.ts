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
import { ProductBatchService } from './product-batch.service';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/product-batches')
export class ProductBatchController {
  constructor(private readonly service: ProductBatchService) {}

  @Get()
  @ApiOperation({ summary: 'List product-batches with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product-batch by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product-batch' })
  create(@Body() dto: CreateProductBatchDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing product-batch' })
  update(@Param('id') id: string, @Body() dto: UpdateProductBatchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product-batch' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
