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
import { AiGenerationLogService } from './ai-generation-log.service';
import { CreateAiGenerationLogDto } from './dto/create-ai-generation-log.dto';
import { UpdateAiGenerationLogDto } from './dto/update-ai-generation-log.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('AI Studio')
@ApiBearerAuth()
@Controller('ai-studio/ai-generation-logs')
export class AiGenerationLogController {
  constructor(private readonly service: AiGenerationLogService) {}

  @Get()
  @ApiOperation({ summary: 'List ai-generation-logs with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ai-generation-log by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ai-generation-log' })
  create(@Body() dto: CreateAiGenerationLogDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing ai-generation-log' })
  update(@Param('id') id: string, @Body() dto: UpdateAiGenerationLogDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ai-generation-log' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
