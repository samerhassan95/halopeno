import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateTicketReplyDto } from './dto/create-ticket-reply.dto';
import { UpdateTicketReplyDto } from './dto/update-ticket-reply.dto';

@Injectable()
export class TicketReplyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ authorType: { contains: search, mode: 'insensitive' as const } }, { authorName: { contains: search, mode: 'insensitive' as const } }, { message: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.ticketReply.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.ticketReply.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.ticketReply.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTicketReplyDto) {
    return this.prisma.ticketReply.create({ data: dto as any });
  }

  update(id: string, dto: UpdateTicketReplyDto) {
    return this.prisma.ticketReply.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.ticketReply.delete({ where: { id } });
  }
}
