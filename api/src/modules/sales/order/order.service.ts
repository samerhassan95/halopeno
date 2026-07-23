import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ orderNumber: { contains: search, mode: 'insensitive' as const } }, { currency: { contains: search, mode: 'insensitive' as const } }, { customerNotes: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.order.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({ data: dto as any });
  }

  update(id: string, dto: UpdateOrderDto) {
    return this.prisma.order.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
