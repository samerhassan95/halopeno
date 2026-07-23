import { PartialType } from '@nestjs/swagger';
import { CreateAiGenerationLogDto } from './create-ai-generation-log.dto';

export class UpdateAiGenerationLogDto extends PartialType(CreateAiGenerationLogDto) {}
