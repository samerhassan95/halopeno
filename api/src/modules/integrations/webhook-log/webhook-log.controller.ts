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
import { WebhookLogService } from './webhook-log.service';
import { CreateWebhookLogDto } from './dto/create-webhook-log.dto';
import { UpdateWebhookLogDto } from './dto/update-webhook-log.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/webhook-logs')
export class WebhookLogController {
  constructor(private readonly service: WebhookLogService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook-logs with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single webhook-log by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook-log' })
  create(@Body() dto: CreateWebhookLogDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing webhook-log' })
  update(@Param('id') id: string, @Body() dto: UpdateWebhookLogDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook-log' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
