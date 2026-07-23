import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePickupLocationDto } from './dto/create-pickup-location.dto';
import { UpdatePickupLocationDto } from './dto/update-pickup-location.dto';

@Injectable()
export class PickupLocationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { address: { contains: search, mode: 'insensitive' as const } }, { city: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.pickupLocation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.pickupLocation.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.pickupLocation.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePickupLocationDto) {
    return this.prisma.pickupLocation.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePickupLocationDto) {
    return this.prisma.pickupLocation.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.pickupLocation.delete({ where: { id } });
  }
}
