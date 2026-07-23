import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateAffiliateReferralDto } from './dto/create-affiliate-referral.dto';
import { UpdateAffiliateReferralDto } from './dto/update-affiliate-referral.dto';

@Injectable()
export class AffiliateReferralService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = {};
    const [data, total] = await Promise.all([
      this.prisma.affiliateReferral.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.affiliateReferral.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.affiliateReferral.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAffiliateReferralDto) {
    return this.prisma.affiliateReferral.create({ data: dto as any });
  }

  update(id: string, dto: UpdateAffiliateReferralDto) {
    return this.prisma.affiliateReferral.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.affiliateReferral.delete({ where: { id } });
  }
}
