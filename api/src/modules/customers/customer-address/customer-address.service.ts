import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';

@Injectable()
export class CustomerAddressService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ label: { contains: search, mode: 'insensitive' as const } }, { line1: { contains: search, mode: 'insensitive' as const } }, { line2: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.customerAddress.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.customerAddress.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.customerAddress.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateCustomerAddressDto) {
    return this.prisma.customerAddress.create({ data: dto as any });
  }

  update(id: string, dto: UpdateCustomerAddressDto) {
    return this.prisma.customerAddress.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.customerAddress.delete({ where: { id } });
  }
}
