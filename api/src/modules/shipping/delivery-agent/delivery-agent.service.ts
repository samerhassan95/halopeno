import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateDeliveryAgentDto } from './dto/create-delivery-agent.dto';
import { UpdateDeliveryAgentDto } from './dto/update-delivery-agent.dto';

@Injectable()
export class DeliveryAgentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.deliveryAgent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.deliveryAgent.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.deliveryAgent.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateDeliveryAgentDto) {
    return this.prisma.deliveryAgent.create({ data: dto as any });
  }

  update(id: string, dto: UpdateDeliveryAgentDto) {
    return this.prisma.deliveryAgent.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.deliveryAgent.delete({ where: { id } });
  }
}
