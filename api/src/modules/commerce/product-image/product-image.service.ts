import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Injectable()
export class ProductImageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ url: { contains: search, mode: 'insensitive' as const } }, { altText: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.productImage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.productImage.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.productImage.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateProductImageDto) {
    return this.prisma.productImage.create({ data: dto as any });
  }

  update(id: string, dto: UpdateProductImageDto) {
    return this.prisma.productImage.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.productImage.delete({ where: { id } });
  }
}
