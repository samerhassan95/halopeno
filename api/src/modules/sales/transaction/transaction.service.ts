import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ type: { contains: search, mode: 'insensitive' as const } }, { gateway: { contains: search, mode: 'insensitive' as const } }, { currency: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.transaction.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTransactionDto) {
    return this.prisma.transaction.create({ data: dto as any });
  }

  update(id: string, dto: UpdateTransactionDto) {
    return this.prisma.transaction.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }
}
