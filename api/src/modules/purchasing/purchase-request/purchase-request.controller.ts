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
import { PurchaseRequestService } from './purchase-request.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Purchasing')
@ApiBearerAuth()
@Controller('purchasing/purchase-requests')
export class PurchaseRequestController {
  constructor(private readonly service: PurchaseRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase-requests with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single purchase-request by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase-request' })
  create(@Body() dto: CreatePurchaseRequestDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing purchase-request' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseRequestDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase-request' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
