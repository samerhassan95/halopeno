import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreatePushCampaignDto } from './dto/create-push-campaign.dto';
import { UpdatePushCampaignDto } from './dto/update-push-campaign.dto';

@Injectable()
export class PushCampaignService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { message: { contains: search, mode: 'insensitive' as const } }, { segment: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.pushCampaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.pushCampaign.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.pushCampaign.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreatePushCampaignDto) {
    return this.prisma.pushCampaign.create({ data: dto as any });
  }

  update(id: string, dto: UpdatePushCampaignDto) {
    return this.prisma.pushCampaign.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.pushCampaign.delete({ where: { id } });
  }
}
