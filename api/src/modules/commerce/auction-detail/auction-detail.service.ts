import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAuctionDetailDto } from './dto/create-auction-detail.dto';
import { UpdateAuctionDetailDto } from './dto/update-auction-detail.dto';

@Injectable()
export class AuctionDetailService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.auctionDetail.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.auctionDetail.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.auctionDetail.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAuctionDetailDto) {
    return this.prisma.auctionDetail.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAuctionDetailDto) {
    return this.prisma.auctionDetail.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.auctionDetail.delete({ where: { id } });
  }
}
