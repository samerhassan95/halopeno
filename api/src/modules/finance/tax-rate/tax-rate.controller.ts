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
import { TaxRateService } from './tax-rate.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/tax-rates')
export class TaxRateController {
  constructor(private readonly service: TaxRateService) {}

  @Get()
  @ApiOperation({ summary: 'List tax-rates with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tax-rate by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tax-rate' })
  create(@Body() dto: CreateTaxRateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing tax-rate' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax-rate' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
