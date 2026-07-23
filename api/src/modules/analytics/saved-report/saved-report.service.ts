import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';
import { UpdateSavedReportDto } from './dto/update-saved-report.dto';

@Injectable()
export class SavedReportService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { type: { contains: search, mode: 'insensitive' as const } }, { scheduleCron: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.savedReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.savedReport.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.savedReport.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateSavedReportDto) {
    return this.prisma.savedReport.create({ data: dto as any });
  }

  update(id: string, dto: UpdateSavedReportDto) {
    return this.prisma.savedReport.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.savedReport.delete({ where: { id } });
  }
}
