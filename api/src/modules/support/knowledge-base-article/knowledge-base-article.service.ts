import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateKnowledgeBaseArticleDto } from './dto/create-knowledge-base-article.dto';
import { UpdateKnowledgeBaseArticleDto } from './dto/update-knowledge-base-article.dto';

@Injectable()
export class KnowledgeBaseArticleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.knowledgeBaseArticle.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateKnowledgeBaseArticleDto) {
    return this.prisma.knowledgeBaseArticle.create({ data: dto as any });
  }

  update(id: string, dto: UpdateKnowledgeBaseArticleDto) {
    return this.prisma.knowledgeBaseArticle.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.knowledgeBaseArticle.delete({ where: { id } });
  }
}
