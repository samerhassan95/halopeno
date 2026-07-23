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
import { TaxClassService } from './tax-class.service';
import { CreateTaxClassDto } from './dto/create-tax-class.dto';
import { UpdateTaxClassDto } from './dto/update-tax-class.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/tax-classes')
export class TaxClassController {
  constructor(private readonly service: TaxClassService) {}

  @Get()
  @ApiOperation({ summary: 'List tax-classes with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tax-class by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tax-class' })
  create(@Body() dto: CreateTaxClassDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing tax-class' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxClassDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax-class' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
