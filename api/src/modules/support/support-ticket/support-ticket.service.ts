import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ subject: { contains: search, mode: 'insensitive' as const } }, { category: { contains: search, mode: 'insensitive' as const } }, { assignedTo: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.supportTicket.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({ data: dto as any });
  }

  update(id: string, dto: UpdateSupportTicketDto) {
    return this.prisma.supportTicket.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.supportTicket.delete({ where: { id } });
  }
}
