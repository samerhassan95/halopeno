import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateWebhookLogDto } from './dto/create-webhook-log.dto';
import { UpdateWebhookLogDto } from './dto/update-webhook-log.dto';

@Injectable()
export class WebhookLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ event: { contains: search, mode: 'insensitive' as const } }, { responseBody: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.webhookLog.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateWebhookLogDto) {
    return this.prisma.webhookLog.create({ data: dto as any });
  }

  update(id: string, dto: UpdateWebhookLogDto) {
    return this.prisma.webhookLog.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.webhookLog.delete({ where: { id } });
  }
}
