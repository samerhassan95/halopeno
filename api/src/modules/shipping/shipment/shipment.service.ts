import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ trackingNumber: { contains: search, mode: 'insensitive' as const } }, { proofImage: { contains: search, mode: 'insensitive' as const } }, { signature: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.shipment.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateShipmentDto) {
    return this.prisma.shipment.create({ data: dto as any });
  }

  update(id: string, dto: UpdateShipmentDto) {
    return this.prisma.shipment.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.shipment.delete({ where: { id } });
  }
}
