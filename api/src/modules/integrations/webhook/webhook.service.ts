import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ url: { contains: search, mode: 'insensitive' as const } }, { secret: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.webhook.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.webhook.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateWebhookDto) {
    return this.prisma.webhook.create({ data: dto as any });
  }

  update(id: string, dto: UpdateWebhookDto) {
    return this.prisma.webhook.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }
}
