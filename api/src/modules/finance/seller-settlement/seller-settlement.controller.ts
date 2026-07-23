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
import { SellerSettlementService } from './seller-settlement.service';
import { CreateSellerSettlementDto } from './dto/create-seller-settlement.dto';
import { UpdateSellerSettlementDto } from './dto/update-seller-settlement.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/seller-settlements')
export class SellerSettlementController {
  constructor(private readonly service: SellerSettlementService) {}

  @Get()
  @ApiOperation({ summary: 'List seller-settlements with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single seller-settlement by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new seller-settlement' })
  create(@Body() dto: CreateSellerSettlementDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing seller-settlement' })
  update(@Param('id') id: string, @Body() dto: UpdateSellerSettlementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a seller-settlement' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
