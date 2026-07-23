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
import { ProductQuestionService } from './product-question.service';
import { CreateProductQuestionDto } from './dto/create-product-question.dto';
import { UpdateProductQuestionDto } from './dto/update-product-question.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Commerce')
@ApiBearerAuth()
@Controller('commerce/product-questions')
export class ProductQuestionController {
  constructor(private readonly service: ProductQuestionService) {}

  @Get()
  @ApiOperation({ summary: 'List product-questions with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product-question by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product-question' })
  create(@Body() dto: CreateProductQuestionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing product-question' })
  update(@Param('id') id: string, @Body() dto: UpdateProductQuestionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product-question' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
