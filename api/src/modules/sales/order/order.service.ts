import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: 'insensitive' as const } },
            { currency: { contains: search, mode: 'insensitive' as const } },
            { customerNotes: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: true,
          seller: true,
          items: { include: { product: true } },
          payments: true,
          shipments: { include: { carrier: true } },
        },
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        seller: true,
        items: { include: { product: { include: { images: true } } } },
        payments: true,
        shipments: { include: { carrier: true, agent: true } },
        refunds: true,
      },
    });

    const customerSummary = await this.prisma.order.aggregate({
      where: { customerId: order.customerId },
      _count: { id: true },
      _sum: { total: true },
    });

    return {
      ...order,
      customer: {
        ...order.customer,
        previousOrderCount: Math.max(0, customerSummary._count.id - 1),
        lifetimeValue: Number(customerSummary._sum.total ?? 0),
      },
    };
  }

  async findForTracking(ref: string) {
    const key = decodeURIComponent(String(ref || '')).trim();
    if (!key) throw new NotFoundException('Order not found');

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: { equals: key, mode: 'insensitive' } }, { id: key }],
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const shipping =
      order.shippingAddress && typeof order.shippingAddress === 'object'
        ? (order.shippingAddress as Record<string, unknown>)
        : {};

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      address: String(shipping.address || shipping.line1 || ''),
      deliveryMethod: String(shipping.deliveryMethod || 'delivery'),
      scheduledTime: shipping.scheduledTime ? String(shipping.scheduledTime) : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({ data: dto as any });
  }

  update(id: string, dto: UpdateOrderDto) {
    return this.prisma.order.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
