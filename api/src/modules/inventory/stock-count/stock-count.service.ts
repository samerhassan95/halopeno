import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateStockCountDto } from './dto/create-stock-count.dto';
import { UpdateStockCountDto } from './dto/update-stock-count.dto';

@Injectable()
export class StockCountService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ reference: { contains: search, mode: 'insensitive' as const } }, { status: { contains: search, mode: 'insensitive' as const } }, { countedBy: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockCount.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.stockCount.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.stockCount.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateStockCountDto) {
    return this.prisma.stockCount.create({ data: dto as any });
  }

  update(id: string, dto: UpdateStockCountDto) {
    return this.prisma.stockCount.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.stockCount.delete({ where: { id } });
  }
}
