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
import { AccountingEntryService } from './accounting-entry.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/accounting-entries')
export class AccountingEntryController {
  constructor(private readonly service: AccountingEntryService) {}

  @Get()
  @ApiOperation({ summary: 'List accounting-entries with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single accounting-entry by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new accounting-entry' })
  create(@Body() dto: CreateAccountingEntryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing accounting-entry' })
  update(@Param('id') id: string, @Body() dto: UpdateAccountingEntryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a accounting-entry' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
