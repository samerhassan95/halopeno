import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';

@Injectable()
export class TaxRateService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ country: { contains: search, mode: 'insensitive' as const } }, { state: { contains: search, mode: 'insensitive' as const } }, { city: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.taxRate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.taxRate.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.taxRate.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTaxRateDto) {
    return this.prisma.taxRate.create({ data: dto as any });
  }

  update(id: string, dto: UpdateTaxRateDto) {
    return this.prisma.taxRate.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.taxRate.delete({ where: { id } });
  }
}
