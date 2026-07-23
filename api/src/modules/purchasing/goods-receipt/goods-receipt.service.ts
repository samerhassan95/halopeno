import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';

@Injectable()
export class GoodsReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = {};
    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.goodsReceipt.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateGoodsReceiptDto) {
    return this.prisma.goodsReceipt.create({ data: dto as any });
  }

  update(id: string, dto: UpdateGoodsReceiptDto) {
    return this.prisma.goodsReceipt.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.goodsReceipt.delete({ where: { id } });
  }
}
