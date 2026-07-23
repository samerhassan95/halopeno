import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@Injectable()
export class CustomerGroupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { description: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.customerGroup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.customerGroup.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.customerGroup.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateCustomerGroupDto) {
    return this.prisma.customerGroup.create({ data: dto as any });
  }

  update(id: string, dto: UpdateCustomerGroupDto) {
    return this.prisma.customerGroup.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.customerGroup.delete({ where: { id } });
  }
}
