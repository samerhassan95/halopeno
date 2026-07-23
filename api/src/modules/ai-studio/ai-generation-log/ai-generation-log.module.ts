import { Module } from '@nestjs/common';
import { AiGenerationLogController } from './ai-generation-log.controller';
import { AiGenerationLogService } from './ai-generation-log.service';

@Module({
  controllers: [AiGenerationLogController],
  providers: [AiGenerationLogService],
  exports: [AiGenerationLogService],
})
export class AiGenerationLogModule {}
