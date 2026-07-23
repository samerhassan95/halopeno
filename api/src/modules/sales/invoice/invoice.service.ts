import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ invoiceNumber: { contains: search, mode: 'insensitive' as const } }, { status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.invoice.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({ data: dto as any });
  }

  update(id: string, dto: UpdateInvoiceDto) {
    return this.prisma.invoice.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
