import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ sku: { contains: search, mode: 'insensitive' as const } }, { barcode: { contains: search, mode: 'insensitive' as const } }, { image: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.productVariant.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.productVariant.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateProductVariantDto) {
    return this.prisma.productVariant.create({ data: dto as any });
  }

  update(id: string, dto: UpdateProductVariantDto) {
    return this.prisma.productVariant.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.productVariant.delete({ where: { id } });
  }
}
