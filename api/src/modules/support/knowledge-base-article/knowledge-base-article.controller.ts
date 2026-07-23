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
import { KnowledgeBaseArticleService } from './knowledge-base-article.service';
import { CreateKnowledgeBaseArticleDto } from './dto/create-knowledge-base-article.dto';
import { UpdateKnowledgeBaseArticleDto } from './dto/update-knowledge-base-article.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support/knowledge-base-articles')
export class KnowledgeBaseArticleController {
  constructor(private readonly service: KnowledgeBaseArticleService) {}

  @Get()
  @ApiOperation({ summary: 'List knowledge-base-articles with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single knowledge-base-article by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge-base-article' })
  create(@Body() dto: CreateKnowledgeBaseArticleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing knowledge-base-article' })
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseArticleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a knowledge-base-article' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
