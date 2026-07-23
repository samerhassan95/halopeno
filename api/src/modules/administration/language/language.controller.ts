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
import { LanguageService } from './language.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Administration')
@ApiBearerAuth()
@Controller('administration/languages')
export class LanguageController {
  constructor(private readonly service: LanguageService) {}

  @Get()
  @ApiOperation({ summary: 'List languages with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single language by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new language' })
  create(@Body() dto: CreateLanguageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing language' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a language' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
