import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateRequestForQuotationDto } from './dto/create-request-for-quotation.dto';
import { UpdateRequestForQuotationDto } from './dto/update-request-for-quotation.dto';

@Injectable()
export class RequestForQuotationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.requestForQuotation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.requestForQuotation.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.requestForQuotation.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateRequestForQuotationDto) {
    return this.prisma.requestForQuotation.create({ data: dto as any });
  }

  update(id: string, dto: UpdateRequestForQuotationDto) {
    return this.prisma.requestForQuotation.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.requestForQuotation.delete({ where: { id } });
  }
}
