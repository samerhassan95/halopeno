import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';

@Injectable()
export class AttributeValueService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ value: { contains: search, mode: 'insensitive' as const } }, { colorHex: { contains: search, mode: 'insensitive' as const } }, { image: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.attributeValue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.attributeValue.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.attributeValue.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAttributeValueDto) {
    return this.prisma.attributeValue.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAttributeValueDto) {
    return this.prisma.attributeValue.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.attributeValue.delete({ where: { id } });
  }
}
