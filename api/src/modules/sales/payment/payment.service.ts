import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ method: { contains: search, mode: 'insensitive' as const } }, { gateway: { contains: search, mode: 'insensitive' as const } }, { currency: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.payment.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePaymentDto) {
    return this.prisma.payment.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePaymentDto) {
    return this.prisma.payment.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}
