import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ action: { contains: search, mode: 'insensitive' as const } }, { entityType: { contains: search, mode: 'insensitive' as const } }, { ipAddress: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.activityLog.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateActivityLogDto) {
    return this.prisma.activityLog.create({ data: dto as any });
  }

  update(id: string, dto: UpdateActivityLogDto) {
    return this.prisma.activityLog.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.activityLog.delete({ where: { id } });
  }
}
