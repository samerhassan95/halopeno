import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { location: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.menu.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.menu.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateMenuDto) {
    return this.prisma.menu.create({ data: dto as any });
  }

  update(id: string, dto: UpdateMenuDto) {
    return this.prisma.menu.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.menu.delete({ where: { id } });
  }
}
