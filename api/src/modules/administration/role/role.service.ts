import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { description: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.role.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto as any });
  }

  update(id: string, dto: UpdateRoleDto) {
    return this.prisma.role.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  async getPermissions(roleId: string) {
    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    return { permissionIds: rows.map((r) => r.permissionId) };
  }

  async setPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.role.findUniqueOrThrow({ where: { id: roleId } });
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);
    return this.getPermissions(roleId);
  }
}
