import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DELIVERED_LIKE: string[] = ['DELIVERED', 'COMPLETED'];
const REFUND_LIKE: string[] = ['REFUNDED', 'PARTIALLY_REFUNDED'];
const RETURN_LIKE: string[] = ['RETURNED', 'PARTIALLY_RETURNED'];

const PRODUCT_STATUS_MAP: Record<string, 'active' | 'draft' | 'out_of_stock' | 'inactive'> = {
  PUBLISHED: 'active',
  APPROVED: 'active',
  DRAFT: 'draft',
  PENDING_REVIEW: 'draft',
  OUT_OF_STOCK: 'out_of_stock',
  REJECTED: 'inactive',
  ARCHIVED: 'inactive',
  DISABLED: 'inactive',
};

function toFrontendProductStatus(status: string): 'active' | 'draft' | 'out_of_stock' | 'inactive' {
  return PRODUCT_STATUS_MAP[status] ?? 'draft';
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      orders,
      orderItems,
      totalCustomers,
      newCustomers,
      activeSellers,
      pendingSellerApprovals,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingRefundRequests,
      openSupportTickets,
      statusGroups,
      recentOrdersRaw,
      topSellingItems,
    ] = await Promise.all([
      this.prisma.order.findMany({
        select: { id: true, total: true, status: true, createdAt: true, sellerId: true },
      }),
      this.prisma.orderItem.findMany({
        select: { productId: true, quantity: true, total: true, unitPrice: true },
      }),
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.seller.count({ where: { status: 'APPROVED' } }),
      this.prisma.seller.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stock: { gt: 0, lte: 15 } } }),
      this.prisma.product.count({ where: { stock: 0 } }),
      this.prisma.refund.count({ where: { status: 'PENDING' } }),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, avatar: true } },
          seller: { select: { shopName: true } },
          payments: { select: { status: true }, take: 1 },
          items: { select: { id: true } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 20,
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const refundedOrders = orders.filter((o) => REFUND_LIKE.includes(o.status)).length;
    const returnedOrders = orders.filter((o) => RETURN_LIKE.includes(o.status)).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const refundedRevenue = orders
      .filter((o) => REFUND_LIKE.includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);

    const productIds = [...new Set(orderItems.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        regularPrice: true,
        stock: true,
        status: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        brandId: true,
        brand: { select: { id: true, name: true } },
        sellerId: true,
        seller: { select: { id: true, shopName: true } },
        images: { take: 1, select: { url: true } },
      },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    const costById = new Map(products.map((p) => [p.id, Number(p.costPrice ?? 0)]));
    const totalCost = orderItems.reduce((sum, i) => sum + costById.get(i.productId)! * i.quantity, 0);
    const grossProfit = totalRevenue - totalCost;

    const ratingGroups = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
    });
    const ratingByProduct = new Map(ratingGroups.map((r) => [r.productId, Number(r._avg.rating ?? 0)]));

    const sellerIds = [...new Set(orders.map((o) => o.sellerId).filter((id): id is string => !!id))];
    const sellersForOrders = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, shopName: true },
    });
    const sellerNameById = new Map(sellersForOrders.map((s) => [s.id, s.shopName]));

    const netRevenue = totalRevenue - refundedRevenue;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const refundRate = totalOrders ? (refundedOrders / totalOrders) * 100 : 0;
    const returnRate = totalOrders ? (returnedOrders / totalOrders) * 100 : 0;

    const orderStatusBreakdown = statusGroups
      .map((g) => ({
        status: g.status,
        count: g._count._all,
        percentage: totalOrders ? Math.round((g._count._all / totalOrders) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const deliveredOrShipped = orders.filter(
      (o) => DELIVERED_LIKE.includes(o.status) || o.status === 'SHIPPED',
    ).length;
    const fulfillmentRate = totalOrders ? Math.round((deliveredOrShipped / totalOrders) * 100) : 0;

    // Revenue trend: last 30 days, bucketed by day
    const trendMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      if (o.createdAt < thirtyDaysAgo) continue;
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(key) ?? { revenue: 0, orders: 0 };
      entry.revenue += Number(o.total);
      entry.orders += 1;
      trendMap.set(key, entry);
    }
    const revenueTrend = Array.from(trendMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topProducts = topSellingItems.map((i) => {
      const p = productById.get(i.productId);
      return {
        id: i.productId,
        name: p?.name ?? 'Unknown product',
        sku: p?.sku ?? '',
        image: p?.images?.[0]?.url ?? '',
        qtySold: i._sum.quantity ?? 0,
        revenue: Number(i._sum.total ?? 0),
        sellerId: p?.sellerId ?? null,
        sellerName: p?.seller?.shopName ?? 'In-house',
        categoryId: p?.categoryId ?? '',
        categoryName: p?.category?.name ?? 'Uncategorized',
        brandName: p?.brand?.name ?? '',
        stock: p?.stock ?? 0,
        price: Number(p?.regularPrice ?? 0),
        status: p ? toFrontendProductStatus(p.status) : 'draft',
        rating: ratingByProduct.get(i.productId) ?? 0,
      };
    });

    // Category / brand revenue across every sold product, not just the top-selling slice above.
    const categoryAgg = new Map<string, { name: string; revenue: number; productIds: Set<string> }>();
    const brandAgg = new Map<string, { name: string; revenue: number }>();
    for (const item of orderItems) {
      const p = productById.get(item.productId);
      if (!p) continue;
      const lineRevenue = Number(item.total);
      if (p.categoryId && p.category) {
        const entry = categoryAgg.get(p.categoryId) ?? { name: p.category.name, revenue: 0, productIds: new Set<string>() };
        entry.revenue += lineRevenue;
        entry.productIds.add(p.id);
        categoryAgg.set(p.categoryId, entry);
      }
      if (p.brandId && p.brand) {
        const entry = brandAgg.get(p.brandId) ?? { name: p.brand.name, revenue: 0 };
        entry.revenue += lineRevenue;
        brandAgg.set(p.brandId, entry);
      }
    }
    const topCategories = Array.from(categoryAgg.entries())
      .map(([id, v]) => ({ id, name: v.name, revenue: v.revenue, productCount: v.productIds.size }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
    const topBrands = Array.from(brandAgg.entries())
      .map(([id, v]) => ({ id, name: v.name, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const sellerAgg = new Map<string, { name: string; revenue: number; orderCount: number }>();
    for (const o of orders) {
      if (!o.sellerId) continue;
      const entry = sellerAgg.get(o.sellerId) ?? {
        name: sellerNameById.get(o.sellerId) ?? 'Unknown seller',
        revenue: 0,
        orderCount: 0,
      };
      entry.revenue += Number(o.total);
      entry.orderCount += 1;
      sellerAgg.set(o.sellerId, entry);
    }
    const topSellers = Array.from(sellerAgg.entries())
      .map(([id, v]) => ({ id, name: v.name, revenue: v.revenue, orderCount: v.orderCount }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      customerAvatar: o.customer.avatar,
      sellerName: o.seller?.shopName ?? 'In-house',
      channel: o.channel,
      date: o.createdAt,
      productCount: o.items.length,
      total: Number(o.total),
      paymentStatus: o.payments[0]?.status ?? 'PENDING',
      status: o.status,
    }));

    return {
      kpis: {
        totalRevenue,
        netRevenue,
        grossProfit,
        totalOrders,
        avgOrderValue,
        refundRate: Math.round(refundRate * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10,
        totalCustomers,
        newCustomers,
        activeSellers,
        pendingSellerApprovals,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        pendingOrders,
        pendingRefundRequests,
        openSupportTickets,
        fulfillmentRate,
      },
      orderStatusBreakdown,
      revenueTrend,
      topProducts,
      topCategories,
      topBrands,
      topSellers,
      recentOrders,
    };
  }
}
