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
import { PurchaseReturnService } from './purchase-return.service';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Purchasing')
@ApiBearerAuth()
@Controller('purchasing/purchase-returns')
export class PurchaseReturnController {
  constructor(private readonly service: PurchaseReturnService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase-returns with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single purchase-return by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase-return' })
  create(@Body() dto: CreatePurchaseReturnDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing purchase-return' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseReturnDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase-return' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
