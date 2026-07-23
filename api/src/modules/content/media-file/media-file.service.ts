import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';

@Injectable()
export class MediaFileService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ fileName: { contains: search, mode: 'insensitive' as const } }, { url: { contains: search, mode: 'insensitive' as const } }, { mimeType: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.mediaFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.mediaFile.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.mediaFile.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateMediaFileDto) {
    return this.prisma.mediaFile.create({ data: dto as any });
  }

  update(id: string, dto: UpdateMediaFileDto) {
    return this.prisma.mediaFile.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.mediaFile.delete({ where: { id } });
  }
}
