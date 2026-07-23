import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

@Injectable()
export class AccountingEntryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ account: { contains: search, mode: 'insensitive' as const } }, { reference: { contains: search, mode: 'insensitive' as const } }, { memo: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.accountingEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.accountingEntry.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.accountingEntry.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAccountingEntryDto) {
    return this.prisma.accountingEntry.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAccountingEntryDto) {
    return this.prisma.accountingEntry.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.accountingEntry.delete({ where: { id } });
  }
}
