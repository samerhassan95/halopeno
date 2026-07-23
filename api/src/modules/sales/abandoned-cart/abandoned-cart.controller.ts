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
import { AbandonedCartService } from './abandoned-cart.service';
import { CreateAbandonedCartDto } from './dto/create-abandoned-cart.dto';
import { UpdateAbandonedCartDto } from './dto/update-abandoned-cart.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales/abandoned-carts')
export class AbandonedCartController {
  constructor(private readonly service: AbandonedCartService) {}

  @Get()
  @ApiOperation({ summary: 'List abandoned-carts with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single abandoned-cart by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new abandoned-cart' })
  create(@Body() dto: CreateAbandonedCartDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing abandoned-cart' })
  update(@Param('id') id: string, @Body() dto: UpdateAbandonedCartDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a abandoned-cart' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
