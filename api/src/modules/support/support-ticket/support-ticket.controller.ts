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
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support/support-tickets')
export class SupportTicketController {
  constructor(private readonly service: SupportTicketService) {}

  @Get()
  @ApiOperation({ summary: 'List support-tickets with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single support-ticket by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new support-ticket' })
  create(@Body() dto: CreateSupportTicketDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing support-ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a support-ticket' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
