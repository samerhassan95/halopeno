import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateLoyaltyTransactionDto } from './dto/create-loyalty-transaction.dto';
import { UpdateLoyaltyTransactionDto } from './dto/update-loyalty-transaction.dto';

@Injectable()
export class LoyaltyTransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ type: { contains: search, mode: 'insensitive' as const } }, { reason: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.loyaltyTransaction.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateLoyaltyTransactionDto) {
    return this.prisma.loyaltyTransaction.create({ data: dto as any });
  }

  update(id: string, dto: UpdateLoyaltyTransactionDto) {
    return this.prisma.loyaltyTransaction.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.loyaltyTransaction.delete({ where: { id } });
  }
}
