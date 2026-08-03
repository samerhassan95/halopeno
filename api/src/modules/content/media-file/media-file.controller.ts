import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

type UploadedMediaFile = {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
};
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

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image or video and create its media record' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  upload(@UploadedFile() file?: UploadedMediaFile) {
    if (!file) throw new BadRequestException('Select a file to upload.');
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) throw new BadRequestException('Only image and video files are supported.');
    if (isImage && file.size > 5 * 1024 * 1024) throw new BadRequestException('Images must be 5 MB or smaller.');
    const port = process.env.PORT ?? 4000;
    const url = `${process.env.PUBLIC_API_ORIGIN ?? `http://localhost:${port}`}/uploads/${file.filename}`;
    return this.service.create({ fileName: file.originalname, url, mimeType: file.mimetype, size: file.size, folder: isImage ? 'images' : 'videos' });
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
