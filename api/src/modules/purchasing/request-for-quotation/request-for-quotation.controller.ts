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
import { RequestForQuotationService } from './request-for-quotation.service';
import { CreateRequestForQuotationDto } from './dto/create-request-for-quotation.dto';
import { UpdateRequestForQuotationDto } from './dto/update-request-for-quotation.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Purchasing')
@ApiBearerAuth()
@Controller('purchasing/request-for-quotations')
export class RequestForQuotationController {
  constructor(private readonly service: RequestForQuotationService) {}

  @Get()
  @ApiOperation({ summary: 'List request-for-quotations with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single request-for-quotation by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new request-for-quotation' })
  create(@Body() dto: CreateRequestForQuotationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing request-for-quotation' })
  update(@Param('id') id: string, @Body() dto: UpdateRequestForQuotationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a request-for-quotation' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
