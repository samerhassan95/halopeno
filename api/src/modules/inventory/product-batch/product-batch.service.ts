import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';

@Injectable()
export class ProductBatchService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ batchNumber: { contains: search, mode: 'insensitive' as const } }, { serialNumber: { contains: search, mode: 'insensitive' as const } }, { supplierBatchRef: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.productBatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.productBatch.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.productBatch.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateProductBatchDto) {
    return this.prisma.productBatch.create({ data: dto as any });
  }

  update(id: string, dto: UpdateProductBatchDto) {
    return this.prisma.productBatch.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.productBatch.delete({ where: { id } });
  }
}
