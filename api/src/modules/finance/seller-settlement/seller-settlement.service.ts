import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateSellerSettlementDto } from './dto/create-seller-settlement.dto';
import { UpdateSellerSettlementDto } from './dto/update-seller-settlement.dto';

@Injectable()
export class SellerSettlementService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.sellerSettlement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.sellerSettlement.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.sellerSettlement.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateSellerSettlementDto) {
    return this.prisma.sellerSettlement.create({ data: dto as any });
  }

  update(id: string, dto: UpdateSellerSettlementDto) {
    return this.prisma.sellerSettlement.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.sellerSettlement.delete({ where: { id } });
  }
}
