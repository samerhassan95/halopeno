import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { body: { contains: search, mode: 'insensitive' as const } }, { recipientType: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto as any });
  }

  update(id: string, dto: UpdateNotificationDto) {
    return this.prisma.notification.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
}
