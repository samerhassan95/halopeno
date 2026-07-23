import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAiGenerationLogDto } from './dto/create-ai-generation-log.dto';
import { UpdateAiGenerationLogDto } from './dto/update-ai-generation-log.dto';

@Injectable()
export class AiGenerationLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ feature: { contains: search, mode: 'insensitive' as const } }, { outputText: { contains: search, mode: 'insensitive' as const } }, { model: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.aiGenerationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.aiGenerationLog.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.aiGenerationLog.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAiGenerationLogDto) {
    return this.prisma.aiGenerationLog.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAiGenerationLogDto) {
    return this.prisma.aiGenerationLog.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.aiGenerationLog.delete({ where: { id } });
  }
}
