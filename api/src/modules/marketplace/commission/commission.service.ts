import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = {};
    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.commission.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateCommissionDto) {
    return this.prisma.commission.create({ data: dto as any });
  }

  update(id: string, dto: UpdateCommissionDto) {
    return this.prisma.commission.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.commission.delete({ where: { id } });
  }
}
