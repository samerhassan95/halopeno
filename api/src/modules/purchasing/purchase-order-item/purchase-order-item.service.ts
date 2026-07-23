import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePurchaseOrderItemDto } from './dto/create-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';

@Injectable()
export class PurchaseOrderItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = {};
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrderItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.purchaseOrderItem.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.purchaseOrderItem.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePurchaseOrderItemDto) {
    return this.prisma.purchaseOrderItem.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePurchaseOrderItemDto) {
    return this.prisma.purchaseOrderItem.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.purchaseOrderItem.delete({ where: { id } });
  }
}
