import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateTaxClassDto } from './dto/create-tax-class.dto';
import { UpdateTaxClassDto } from './dto/update-tax-class.dto';

@Injectable()
export class TaxClassService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.taxClass.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.taxClass.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.taxClass.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTaxClassDto) {
    return this.prisma.taxClass.create({ data: dto as any });
  }

  update(id: string, dto: UpdateTaxClassDto) {
    return this.prisma.taxClass.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.taxClass.delete({ where: { id } });
  }
}
