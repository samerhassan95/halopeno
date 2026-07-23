import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';

@Injectable()
export class StockItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ binLocation: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.stockItem.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.stockItem.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateStockItemDto) {
    return this.prisma.stockItem.create({ data: dto as any });
  }

  update(id: string, dto: UpdateStockItemDto) {
    return this.prisma.stockItem.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.stockItem.delete({ where: { id } });
  }
}
