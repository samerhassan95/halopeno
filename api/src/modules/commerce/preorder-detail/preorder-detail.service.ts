import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePreorderDetailDto } from './dto/create-preorder-detail.dto';
import { UpdatePreorderDetailDto } from './dto/update-preorder-detail.dto';

@Injectable()
export class PreorderDetailService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ status: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.preorderDetail.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.preorderDetail.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.preorderDetail.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePreorderDetailDto) {
    return this.prisma.preorderDetail.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePreorderDetailDto) {
    return this.prisma.preorderDetail.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.preorderDetail.delete({ where: { id } });
  }
}
