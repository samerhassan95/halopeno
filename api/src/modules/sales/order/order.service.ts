import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateStorefrontOrderDto } from './dto/create-storefront-order.dto';

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
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.order.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({ data: dto as any });
  }

  async createFromStorefront(dto: CreateStorefrontOrderDto) {
    const customer = await this.prisma.customer.upsert({
      where: { email: dto.customerEmail.toLowerCase() },
      create: {
        name: dto.customerName,
        email: dto.customerEmail.toLowerCase(),
        phone: dto.customerPhone,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        preferredCurrency: 'SAR',
        tags: ['storefront'],
      },
      update: {
        name: dto.customerName,
        phone: dto.customerPhone ?? undefined,
      },
    });

    const resolvedItems = await Promise.all(
      dto.items.map(async (item) => {
        let product = item.productId
          ? await this.prisma.product.findUnique({ where: { id: item.productId } })
          : null;

        // Storefront cart may send local/non-DB product ids — fall back to slug.
        if (!product && item.productSlug) {
          product = await this.prisma.product.findUnique({
            where: { slug: item.productSlug },
          });
        }

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productSlug}`);
        }

        const lineTotal = item.unitPrice * item.quantity;
        return {
          productId: product.id,
          variantId: item.variantId,
          name: item.name || product.name,
          sku: item.sku || product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: lineTotal,
        };
      }),
    );

    if (resolvedItems.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    const shippingAddress = {
      label: dto.deliveryMethod,
      line1: dto.address,
      scheduledTime: dto.scheduledTime ?? null,
    };

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: dto.orderNumber,
          customerId: customer.id,
          channel: 'IN_HOUSE',
          source: 'WEBSITE',
          status: 'CONFIRMED',
          currency: 'SAR',
          subtotal: dto.subtotal,
          discountTotal: dto.discountTotal,
          taxTotal: dto.taxTotal,
          shippingTotal: dto.shippingTotal,
          total: dto.total,
          shippingAddress,
          billingAddress: shippingAddress,
          customerNotes: dto.customerNotes,
          couponCode: dto.couponCode,
          items: {
            create: resolvedItems,
          },
          payments: {
            create: {
              method: dto.paymentMethod,
              amount: dto.total,
              currency: 'SAR',
              status: 'PENDING',
            },
          },
        },
        include: {
          items: true,
          payments: true,
          customer: true,
        },
      });

      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  update(id: string, dto: UpdateOrderDto) {
    return this.prisma.order.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
