import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ code: { contains: search, mode: 'insensitive' as const } }, { module: { contains: search, mode: 'insensitive' as const } }, { action: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.permission.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.permission.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
}
