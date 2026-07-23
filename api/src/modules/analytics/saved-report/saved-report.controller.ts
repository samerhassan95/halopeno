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
import { SavedReportService } from './saved-report.service';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';
import { UpdateSavedReportDto } from './dto/update-saved-report.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics/saved-reports')
export class SavedReportController {
  constructor(private readonly service: SavedReportService) {}

  @Get()
  @ApiOperation({ summary: 'List saved-reports with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single saved-report by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new saved-report' })
  create(@Body() dto: CreateSavedReportDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing saved-report' })
  update(@Param('id') id: string, @Body() dto: UpdateSavedReportDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved-report' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
