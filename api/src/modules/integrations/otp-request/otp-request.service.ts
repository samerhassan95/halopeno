import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateOtpRequestDto } from './dto/create-otp-request.dto';
import { UpdateOtpRequestDto } from './dto/update-otp-request.dto';

@Injectable()
export class OtpRequestService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ useCase: { contains: search, mode: 'insensitive' as const } }, { channel: { contains: search, mode: 'insensitive' as const } }, { destination: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.otpRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { id: 'desc' },
      }),
      this.prisma.otpRequest.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.otpRequest.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateOtpRequestDto) {
    return this.prisma.otpRequest.create({ data: dto as any });
  }

  update(id: string, dto: UpdateOtpRequestDto) {
    return this.prisma.otpRequest.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.otpRequest.delete({ where: { id } });
  }
}
