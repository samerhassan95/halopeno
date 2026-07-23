import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';

@Injectable()
export class StockAdjustmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ reason: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.stockAdjustment.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateStockAdjustmentDto) {
    return this.prisma.stockAdjustment.create({ data: dto as any });
  }

  update(id: string, dto: UpdateStockAdjustmentDto) {
    return this.prisma.stockAdjustment.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.stockAdjustment.delete({ where: { id } });
  }
}
