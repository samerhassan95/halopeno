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
import { TicketReplyService } from './ticket-reply.service';
import { CreateTicketReplyDto } from './dto/create-ticket-reply.dto';
import { UpdateTicketReplyDto } from './dto/update-ticket-reply.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support/ticket-replies')
export class TicketReplyController {
  constructor(private readonly service: TicketReplyService) {}

  @Get()
  @ApiOperation({ summary: 'List ticket-replies with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ticket-reply by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket-reply' })
  create(@Body() dto: CreateTicketReplyDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing ticket-reply' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketReplyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket-reply' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
