import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';

@Injectable()
export class ShippingZoneService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.shippingZone.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.shippingZone.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.shippingZone.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateShippingZoneDto) {
    return this.prisma.shippingZone.create({ data: dto as any });
  }

  update(id: string, dto: UpdateShippingZoneDto) {
    return this.prisma.shippingZone.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } });
  }
}
