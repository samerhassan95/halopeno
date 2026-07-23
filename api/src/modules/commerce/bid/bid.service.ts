import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';

@Injectable()
export class BidService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = {};
    const [data, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.bid.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.bid.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateBidDto) {
    return this.prisma.bid.create({ data: dto as any });
  }

  update(id: string, dto: UpdateBidDto) {
    return this.prisma.bid.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.bid.delete({ where: { id } });
  }
}
