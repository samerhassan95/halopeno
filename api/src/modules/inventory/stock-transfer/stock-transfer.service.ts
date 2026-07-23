import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';

@Injectable()
export class StockTransferService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.stockTransfer.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateStockTransferDto) {
    return this.prisma.stockTransfer.create({ data: dto as any });
  }

  update(id: string, dto: UpdateStockTransferDto) {
    return this.prisma.stockTransfer.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.stockTransfer.delete({ where: { id } });
  }
}
