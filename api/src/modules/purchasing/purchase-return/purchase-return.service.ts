import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { UpdatePurchaseReturnDto } from './dto/update-purchase-return.dto';

@Injectable()
export class PurchaseReturnService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ reason: { contains: search, mode: 'insensitive' as const } }, { status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.purchaseReturn.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.purchaseReturn.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePurchaseReturnDto) {
    return this.prisma.purchaseReturn.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePurchaseReturnDto) {
    return this.prisma.purchaseReturn.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.purchaseReturn.delete({ where: { id } });
  }
}
