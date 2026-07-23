import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@Injectable()
export class NotificationTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ code: { contains: search, mode: 'insensitive' as const } }, { subject: { contains: search, mode: 'insensitive' as const } }, { body: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.notificationTemplate.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.create({ data: dto as any });
  }

  update(id: string, dto: UpdateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}
