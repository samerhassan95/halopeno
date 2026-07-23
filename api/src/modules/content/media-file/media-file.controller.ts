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
import { MediaFileService } from './media-file.service';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Content')
@ApiBearerAuth()
@Controller('content/media-files')
export class MediaFileController {
  constructor(private readonly service: MediaFileService) {}

  @Get()
  @ApiOperation({ summary: 'List media-files with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single media-file by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new media-file' })
  create(@Body() dto: CreateMediaFileDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing media-file' })
  update(@Param('id') id: string, @Body() dto: UpdateMediaFileDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media-file' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
