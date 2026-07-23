import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateIntegrationConnectionDto } from './dto/create-integration-connection.dto';
import { UpdateIntegrationConnectionDto } from './dto/update-integration-connection.dto';

@Injectable()
export class IntegrationConnectionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ provider: { contains: search, mode: 'insensitive' as const } }, { category: { contains: search, mode: 'insensitive' as const } }, { status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.integrationConnection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.integrationConnection.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.integrationConnection.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateIntegrationConnectionDto) {
    return this.prisma.integrationConnection.create({ data: dto as any });
  }

  update(id: string, dto: UpdateIntegrationConnectionDto) {
    return this.prisma.integrationConnection.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.integrationConnection.delete({ where: { id } });
  }
}
