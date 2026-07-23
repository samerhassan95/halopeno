import { Module } from '@nestjs/common';
import { MediaFileController } from './media-file.controller';
import { MediaFileService } from './media-file.service';

@Module({
  controllers: [MediaFileController],
  providers: [MediaFileService],
  exports: [MediaFileService],
})
export class MediaFileModule {}
