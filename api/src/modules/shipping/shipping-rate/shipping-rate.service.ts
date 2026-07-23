import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import { UpdateShippingRateDto } from './dto/update-shipping-rate.dto';

@Injectable()
export class ShippingRateService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { type: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.shippingRate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.shippingRate.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.shippingRate.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateShippingRateDto) {
    return this.prisma.shippingRate.create({ data: dto as any });
  }

  update(id: string, dto: UpdateShippingRateDto) {
    return this.prisma.shippingRate.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.shippingRate.delete({ where: { id } });
  }
}
