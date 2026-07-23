import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ reason: { contains: search, mode: 'insensitive' as const } }, { method: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.refund.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateRefundDto) {
    return this.prisma.refund.create({ data: dto as any });
  }

  update(id: string, dto: UpdateRefundDto) {
    return this.prisma.refund.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.refund.delete({ where: { id } });
  }
}
