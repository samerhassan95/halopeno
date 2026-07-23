import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';

@Injectable()
export class PayoutService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ notes: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.payout.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePayoutDto) {
    return this.prisma.payout.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePayoutDto) {
    return this.prisma.payout.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.payout.delete({ where: { id } });
  }
}
