import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';

@Injectable()
export class PopupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } }, { trigger: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.popup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.popup.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.popup.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePopupDto) {
    return this.prisma.popup.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePopupDto) {
    return this.prisma.popup.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.popup.delete({ where: { id } });
  }
}
