import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { UpdateEmailCampaignDto } from './dto/update-email-campaign.dto';

@Injectable()
export class EmailCampaignService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { subject: { contains: search, mode: 'insensitive' as const } }, { body: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.emailCampaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.emailCampaign.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.emailCampaign.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateEmailCampaignDto) {
    return this.prisma.emailCampaign.create({ data: dto as any });
  }

  update(id: string, dto: UpdateEmailCampaignDto) {
    return this.prisma.emailCampaign.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.emailCampaign.delete({ where: { id } });
  }
}
