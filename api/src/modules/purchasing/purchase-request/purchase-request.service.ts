import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

@Injectable()
export class PurchaseRequestService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ requestedBy: { contains: search, mode: 'insensitive' as const } }, { status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.purchaseRequest.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.purchaseRequest.delete({ where: { id } });
  }
}
