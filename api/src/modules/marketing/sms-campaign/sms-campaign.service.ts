import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateSmsCampaignDto } from './dto/create-sms-campaign.dto';
import { UpdateSmsCampaignDto } from './dto/update-sms-campaign.dto';

@Injectable()
export class SmsCampaignService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { message: { contains: search, mode: 'insensitive' as const } }, { segment: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.smsCampaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.smsCampaign.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.smsCampaign.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateSmsCampaignDto) {
    return this.prisma.smsCampaign.create({ data: dto as any });
  }

  update(id: string, dto: UpdateSmsCampaignDto) {
    return this.prisma.smsCampaign.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.smsCampaign.delete({ where: { id } });
  }
}
