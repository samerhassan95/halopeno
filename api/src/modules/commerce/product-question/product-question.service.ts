import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateProductQuestionDto } from './dto/create-product-question.dto';
import { UpdateProductQuestionDto } from './dto/update-product-question.dto';

@Injectable()
export class ProductQuestionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ question: { contains: search, mode: 'insensitive' as const } }, { answer: { contains: search, mode: 'insensitive' as const } }, { answeredBy: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.productQuestion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.productQuestion.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.productQuestion.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateProductQuestionDto) {
    return this.prisma.productQuestion.create({ data: dto as any });
  }

  update(id: string, dto: UpdateProductQuestionDto) {
    return this.prisma.productQuestion.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.productQuestion.delete({ where: { id } });
  }
}
