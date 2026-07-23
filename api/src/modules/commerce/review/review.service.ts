import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { body: { contains: search, mode: 'insensitive' as const } }, { reply: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.review.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: dto as any });
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
