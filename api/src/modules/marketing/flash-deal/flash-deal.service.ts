import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateFlashDealDto } from './dto/create-flash-deal.dto';
import { UpdateFlashDealDto } from './dto/update-flash-deal.dto';

@Injectable()
export class FlashDealService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { banner: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.flashDeal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.flashDeal.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.flashDeal.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateFlashDealDto) {
    return this.prisma.flashDeal.create({ data: dto as any });
  }

  update(id: string, dto: UpdateFlashDealDto) {
    return this.prisma.flashDeal.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.flashDeal.delete({ where: { id } });
  }
}
