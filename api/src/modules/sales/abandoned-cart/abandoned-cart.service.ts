import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAbandonedCartDto } from './dto/create-abandoned-cart.dto';
import { UpdateAbandonedCartDto } from './dto/update-abandoned-cart.dto';

@Injectable()
export class AbandonedCartService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ guestEmail: { contains: search, mode: 'insensitive' as const } }, { recoveryStatus: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.abandonedCart.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.abandonedCart.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.abandonedCart.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAbandonedCartDto) {
    return this.prisma.abandonedCart.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAbandonedCartDto) {
    return this.prisma.abandonedCart.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.abandonedCart.delete({ where: { id } });
  }
}
