import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

function rangeToDays(range?: string): number {
  return RANGE_DAYS[range ?? '30d'] ?? 30;
}

function pctChange(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const REFUND_LIKE = ['REFUNDED', 'PARTIALLY_REFUNDED'];
const CANCELLED = ['CANCELLED'];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private periodBounds(range?: string) {
    const days = rangeToDays(range);
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
    return { now, days, currentStart, previousStart };
  }

  async getSalesReport(range?: string) {
    const { currentStart, previousStart, days } = this.periodBounds(range);

    const [currentOrders, previousOrders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: currentStart } },
        include: { items: true, payments: true, customer: { include: { addresses: true } } },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
        select: { total: true, discountTotal: true, taxTotal: true, shippingTotal: true, status: true },
      }),
      Promise.resolve(null),
    ]);

    const sum = (arr: typeof currentOrders, key: 'total' | 'discountTotal' | 'taxTotal' | 'shippingTotal') =>
      arr.reduce((s, o) => s + Number(o[key]), 0);

    const grossSales = sum(currentOrders, 'total');
    const discounts = sum(currentOrders, 'discountTotal');
    const taxes = sum(currentOrders, 'taxTotal');
    const shippingRevenue = sum(currentOrders, 'shippingTotal');
    const refundedOrders = currentOrders.filter((o) => REFUND_LIKE.includes(o.status));
    const refunds = sum(refundedOrders, 'total');
    const netSales = grossSales - refunds;
    const totalOrders = currentOrders.length;
    const avgOrderValue = totalOrders ? grossSales / totalOrders : 0;

    const prevGross = sum(previousOrders as any, 'total');
    const prevOrders = previousOrders.length;
    const prevRefunds = previousOrders.filter((o) => REFUND_LIKE.includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
    const prevNet = prevGross - prevRefunds;
    const prevAov = prevOrders ? prevGross / prevOrders : 0;

    const trendMap = new Map<string, { gross: number; net: number; orders: number }>();
    for (const o of currentOrders) {
      const key = dayKey(o.createdAt);
      const entry = trendMap.get(key) ?? { gross: 0, net: 0, orders: 0 };
      entry.gross += Number(o.total);
      entry.net += REFUND_LIKE.includes(o.status) ? 0 : Number(o.total);
      entry.orders += 1;
      trendMap.set(key, entry);
    }
    const salesTrend = Array.from(trendMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const channelAgg = new Map<string, { revenue: number; orders: number }>();
    for (const o of currentOrders) {
      const entry = channelAgg.get(o.channel) ?? { revenue: 0, orders: 0 };
      entry.revenue += Number(o.total);
      entry.orders += 1;
      channelAgg.set(o.channel, entry);
    }
    const salesByChannel = Array.from(channelAgg.entries()).map(([channel, v]) => ({ channel, ...v }));

    const methodAgg = new Map<string, { revenue: number; count: number }>();
    for (const o of currentOrders) {
      const method = o.payments[0]?.method ?? 'unknown';
      const entry = methodAgg.get(method) ?? { revenue: 0, count: 0 };
      entry.revenue += Number(o.total);
      entry.count += 1;
      methodAgg.set(method, entry);
    }
    const salesByPaymentMethod = Array.from(methodAgg.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    const countryAgg = new Map<string, number>();
    for (const o of currentOrders) {
      const country =
        (o.shippingAddress as any)?.country ?? o.customer.addresses.find((a) => a.isDefault)?.country ?? 'Unknown';
      countryAgg.set(country, (countryAgg.get(country) ?? 0) + Number(o.total));
    }
    const salesByCountry = Array.from(countryAgg.entries())
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const productIds = [...new Set(currentOrders.flatMap((o) => o.items.map((i) => i.productId)))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        categoryId: true,
        category: { select: { name: true } },
        sellerId: true,
        seller: { select: { shopName: true } },
      },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const byProductAgg = new Map<
      string,
      { name: string; sku: string; qty: number; gross: number; discount: number; refund: number }
    >();
    const byCategoryAgg = new Map<string, { name: string; revenue: number; qty: number }>();
    const bySellerAgg = new Map<string, { name: string; revenue: number; orders: Set<string> }>();

    for (const o of currentOrders) {
      const isRefunded = REFUND_LIKE.includes(o.status);
      for (const item of o.items) {
        const p = productById.get(item.productId);
        const entry = byProductAgg.get(item.productId) ?? {
          name: item.name,
          sku: item.sku,
          qty: 0,
          gross: 0,
          discount: 0,
          refund: 0,
        };
        entry.qty += item.quantity;
        entry.gross += Number(item.total);
        entry.discount += Number(item.discount);
        if (isRefunded) entry.refund += Number(item.total);
        byProductAgg.set(item.productId, entry);

        if (p?.categoryId) {
          const c = byCategoryAgg.get(p.categoryId) ?? { name: p.category?.name ?? 'Uncategorized', revenue: 0, qty: 0 };
          c.revenue += Number(item.total);
          c.qty += item.quantity;
          byCategoryAgg.set(p.categoryId, c);
        }
      }
      const sellerKey = o.sellerId ?? 'in-house';
      const s = bySellerAgg.get(sellerKey) ?? { name: 'In-house', revenue: 0, orders: new Set<string>() };
      s.revenue += Number(o.total);
      s.orders.add(o.id);
      bySellerAgg.set(sellerKey, s);
    }
    // fill seller display names for actual sellers
    for (const p of products) {
      if (p.sellerId && bySellerAgg.has(p.sellerId)) {
        bySellerAgg.get(p.sellerId)!.name = p.seller?.shopName ?? 'Seller';
      }
    }

    const byProduct = Array.from(byProductAgg.entries())
      .map(([productId, v]) => {
        const cost = Number(productById.get(productId)?.costPrice ?? 0) * v.qty;
        return {
          productId,
          name: v.name,
          sku: v.sku,
          qtySold: v.qty,
          grossSales: v.gross,
          discount: v.discount,
          refund: v.refund,
          netSales: v.gross - v.refund,
          profit: v.gross - v.refund - cost,
        };
      })
      .sort((a, b) => b.grossSales - a.grossSales);

    const byCategory = Array.from(byCategoryAgg.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    const bySeller = Array.from(bySellerAgg.entries())
      .map(([id, v]) => ({ id, name: v.name, revenue: v.revenue, orders: v.orders.size }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      range: { days, from: currentStart, to: new Date() },
      kpis: {
        grossSales,
        netSales,
        orders: totalOrders,
        avgOrderValue,
        discounts,
        refunds,
        taxes,
        shippingRevenue,
      },
      comparison: {
        grossSalesChangePct: pctChange(grossSales, prevGross),
        netSalesChangePct: pctChange(netSales, prevNet),
        ordersChangePct: pctChange(totalOrders, prevOrders),
        avgOrderValueChangePct: pctChange(avgOrderValue, prevAov),
      },
      salesTrend,
      salesByChannel,
      salesByPaymentMethod,
      salesByCountry,
      byProduct: byProduct.slice(0, 50),
      byCategory,
      bySeller,
    };
  }

  async getProductsReport(range?: string) {
    const { currentStart } = this.periodBounds(range);

    const [orderItems, products, returns] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: currentStart } } },
        include: { order: { select: { status: true, createdAt: true } } },
      }),
      this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          regularPrice: true,
          stock: true,
          status: true,
          rating: true,
          reviewCount: true,
          returnEligible: true,
          category: { select: { name: true } },
          seller: { select: { shopName: true } },
        },
      }),
      this.prisma.return.findMany({
        where: { createdAt: { gte: currentStart } },
        include: { order: { include: { items: true } } },
      }),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));

    const agg = new Map<string, { qty: number; revenue: number; refundQty: number }>();
    for (const item of orderItems) {
      const e = agg.get(item.productId) ?? { qty: 0, revenue: 0, refundQty: 0 };
      e.qty += item.quantity;
      e.revenue += Number(item.total);
      if (REFUND_LIKE.includes(item.order.status)) e.refundQty += item.quantity;
      agg.set(item.productId, e);
    }

    const returnedQtyByProduct = new Map<string, number>();
    for (const r of returns) {
      for (const item of r.order.items) {
        returnedQtyByProduct.set(item.productId, (returnedQtyByProduct.get(item.productId) ?? 0) + item.quantity);
      }
    }

    const rows = Array.from(agg.entries()).map(([id, v]) => {
      const p = productById.get(id);
      const cost = Number(p?.costPrice ?? 0) * v.qty;
      const returnedQty = returnedQtyByProduct.get(id) ?? 0;
      return {
        id,
        name: p?.name ?? 'Unknown',
        sku: p?.sku ?? '',
        category: p?.category?.name ?? 'Uncategorized',
        seller: p?.seller?.shopName ?? 'In-house',
        unitsSold: v.qty,
        revenue: v.revenue,
        cost,
        profit: v.revenue - cost,
        marginPct: v.revenue ? Math.round(((v.revenue - cost) / v.revenue) * 1000) / 10 : 0,
        rating: Number(p?.rating ?? 0),
        stock: p?.stock ?? 0,
        returnedQty,
        returnRate: v.qty ? Math.round((returnedQty / v.qty) * 1000) / 10 : 0,
      };
    });

    const totalUnitsSold = rows.reduce((s, r) => s + r.unitsSold, 0);
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalReturned = rows.reduce((s, r) => s + r.returnedQty, 0);
    const avgRating = products.length ? products.reduce((s, p) => s + Number(p.rating), 0) / products.length : 0;

    const soldProductIds = new Set(rows.map((r) => r.id));
    const lowPerforming = products
      .filter((p) => p.status === 'PUBLISHED' && !soldProductIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name ?? 'Uncategorized',
        seller: p.seller?.shopName ?? 'In-house',
        stock: p.stock,
        rating: Number(p.rating),
      }))
      .slice(0, 20);

    return {
      kpis: {
        totalProducts: products.length,
        unitsSold: totalUnitsSold,
        revenue: totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        returnRate: totalUnitsSold ? Math.round((totalReturned / totalUnitsSold) * 1000) / 10 : 0,
      },
      bestSelling: rows.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 20),
      profitability: [...rows].sort((a, b) => b.profit - a.profit),
      returns: rows.filter((r) => r.returnedQty > 0).sort((a, b) => b.returnedQty - a.returnedQty),
      lowPerforming,
    };
  }

  async getSellersReport(range?: string) {
    const { currentStart } = this.periodBounds(range);

    const [sellers, orders, commissions] = await Promise.all([
      this.prisma.seller.findMany({
        select: { id: true, shopName: true, status: true, rating: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: currentStart }, sellerId: { not: null } },
        select: { sellerId: true, total: true, status: true },
      }),
      this.prisma.commission.findMany({ where: { sellerId: { not: null } } }),
    ]);

    const commissionBySeller = new Map<string, number>();
    for (const c of commissions) {
      if (!c.sellerId) continue;
      commissionBySeller.set(c.sellerId, Number(c.value));
    }

    const agg = new Map<string, { revenue: number; orders: number; refunded: number; cancelled: number }>();
    for (const o of orders) {
      const key = o.sellerId!;
      const e = agg.get(key) ?? { revenue: 0, orders: 0, refunded: 0, cancelled: 0 };
      e.revenue += Number(o.total);
      e.orders += 1;
      if (REFUND_LIKE.includes(o.status)) e.refunded += 1;
      if (CANCELLED.includes(o.status)) e.cancelled += 1;
      agg.set(key, e);
    }

    const bySeller = sellers
      .filter((s) => agg.has(s.id))
      .map((s) => {
        const e = agg.get(s.id)!;
        const commissionPct = commissionBySeller.get(s.id) ?? 10;
        return {
          id: s.id,
          name: s.shopName,
          status: s.status,
          sales: e.revenue,
          orders: e.orders,
          commission: (e.revenue * commissionPct) / 100,
          refundRate: e.orders ? Math.round((e.refunded / e.orders) * 1000) / 10 : 0,
          cancellationRate: e.orders ? Math.round((e.cancelled / e.orders) * 1000) / 10 : 0,
          rating: Number(s.rating),
        };
      })
      .sort((a, b) => b.sales - a.sales);

    const totalSales = bySeller.reduce((s, r) => s + r.sales, 0);
    const totalOrders = bySeller.reduce((s, r) => s + r.orders, 0);
    const totalCommission = bySeller.reduce((s, r) => s + r.commission, 0);
    const avgRefundRate = bySeller.length ? bySeller.reduce((s, r) => s + r.refundRate, 0) / bySeller.length : 0;
    const avgCancellationRate = bySeller.length
      ? bySeller.reduce((s, r) => s + r.cancellationRate, 0) / bySeller.length
      : 0;
    const avgRating = sellers.length ? sellers.reduce((s, r) => s + Number(r.rating), 0) / sellers.length : 0;

    return {
      kpis: {
        totalSellerSales: totalSales,
        sellerOrders: totalOrders,
        commissionEarned: totalCommission,
        refundRate: Math.round(avgRefundRate * 10) / 10,
        cancellationRate: Math.round(avgCancellationRate * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
        activeSellers: sellers.filter((s) => s.status === 'APPROVED').length,
      },
      bySeller,
    };
  }

  async getCustomersReport(range?: string) {
    const { currentStart, previousStart } = this.periodBounds(range);

    const [customers, ordersInRange, ordersBefore] = await Promise.all([
      this.prisma.customer.findMany({
        include: { addresses: true, group: { select: { name: true } } },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: currentStart } },
        select: { customerId: true, total: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { lt: currentStart } },
        select: { customerId: true },
      }),
    ]);

    const customersWithPriorOrders = new Set(ordersBefore.map((o) => o.customerId));
    const newCustomers = customers.filter((c) => c.createdAt >= currentStart).length;
    const previousNewCustomers = customers.filter((c) => c.createdAt >= previousStart && c.createdAt < currentStart).length;

    const ordersByCustomer = new Map<string, { count: number; revenue: number }>();
    for (const o of ordersInRange) {
      const e = ordersByCustomer.get(o.customerId) ?? { count: 0, revenue: 0 };
      e.count += 1;
      e.revenue += Number(o.total);
      ordersByCustomer.set(o.customerId, e);
    }
    const returningCustomers = [...ordersByCustomer.keys()].filter((id) => customersWithPriorOrders.has(id)).length;
    const activeCustomersInRange = ordersByCustomer.size;
    const repeatPurchaseRate = activeCustomersInRange
      ? Math.round((returningCustomers / activeCustomersInRange) * 1000) / 10
      : 0;

    const allOrdersForLtv = await this.prisma.order.groupBy({ by: ['customerId'], _sum: { total: true } });
    const ltvValues = allOrdersForLtv.map((o) => Number(o._sum.total ?? 0));
    const avgLtv = ltvValues.length ? ltvValues.reduce((s, v) => s + v, 0) / ltvValues.length : 0;

    const priorActiveNotReturning = [...customersWithPriorOrders].filter((id) => !ordersByCustomer.has(id)).length;
    const churnRate = customersWithPriorOrders.size
      ? Math.round((priorActiveNotReturning / customersWithPriorOrders.size) * 1000) / 10
      : 0;

    const acquisitionMap = new Map<string, number>();
    for (const c of customers) {
      if (c.createdAt < currentStart) continue;
      const key = dayKey(c.createdAt);
      acquisitionMap.set(key, (acquisitionMap.get(key) ?? 0) + 1);
    }
    const acquisitionTrend = Array.from(acquisitionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const segmentBuckets = [
      { label: '1 order', min: 1, max: 1 },
      { label: '2-5 orders', min: 2, max: 5 },
      { label: '6+ orders', min: 6, max: Infinity },
    ];
    const orderCountAll = new Map<string, number>();
    for (const o of [...ordersInRange, ...ordersBefore]) {
      orderCountAll.set(o.customerId, (orderCountAll.get(o.customerId) ?? 0) + 1);
    }
    const segments = segmentBuckets.map((b) => ({
      label: b.label,
      customers: [...orderCountAll.values()].filter((c) => c >= b.min && c <= b.max).length,
    }));

    const countryAgg = new Map<string, { customers: number; revenue: number }>();
    for (const c of customers) {
      const country = c.addresses.find((a) => a.isDefault)?.country ?? c.addresses[0]?.country ?? 'Unknown';
      const e = countryAgg.get(country) ?? { customers: 0, revenue: 0 };
      e.customers += 1;
      e.revenue += ordersByCustomer.get(c.id)?.revenue ?? 0;
      countryAgg.set(country, e);
    }
    const locations = Array.from(countryAgg.entries())
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 10);

    return {
      kpis: {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        lifetimeValue: avgLtv,
        repeatPurchaseRate,
        churnRate,
      },
      comparison: { newCustomersChangePct: pctChange(newCustomers, previousNewCustomers) },
      acquisitionTrend,
      segments,
      locations,
    };
  }

  async getTaxReport(range?: string) {
    const { currentStart } = this.periodBounds(range);

    const [orders, taxClasses] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: currentStart } },
        include: {
          items: { include: { product: { select: { taxClassId: true } } } },
          customer: { include: { addresses: true } },
        },
      }),
      this.prisma.taxClass.findMany({ include: { rates: true } }),
    ]);

    const taxClassById = new Map(taxClasses.map((t) => [t.id, t]));

    const taxCollected = orders.reduce((s, o) => s + Number(o.taxTotal), 0);
    const refundedOrders = orders.filter((o) => REFUND_LIKE.includes(o.status));
    const taxRefunded = refundedOrders.reduce((s, o) => s + Number(o.taxTotal), 0);
    const taxableSales = orders.reduce((s, o) => s + Number(o.subtotal), 0);

    const byClassAgg = new Map<string, { name: string; tax: number; sales: number }>();
    const byCountryAgg = new Map<string, { tax: number; sales: number }>();
    for (const o of orders) {
      const country =
        (o.shippingAddress as any)?.country ?? o.customer.addresses.find((a) => a.isDefault)?.country ?? 'Unknown';
      const cEntry = byCountryAgg.get(country) ?? { tax: 0, sales: 0 };
      cEntry.tax += Number(o.taxTotal);
      cEntry.sales += Number(o.subtotal);
      byCountryAgg.set(country, cEntry);

      // Line items don't carry their own populated tax amount in this dataset, so allocate
      // the order's actual taxTotal across items proportionally to their share of the subtotal.
      const orderSubtotal = Number(o.subtotal);
      for (const item of o.items) {
        const taxClassId = item.product.taxClassId;
        const key = taxClassId ?? 'default';
        const name = taxClassId ? (taxClassById.get(taxClassId)?.name ?? 'Unknown class') : 'Default';
        const entry = byClassAgg.get(key) ?? { name, tax: 0, sales: 0 };
        const itemShare = orderSubtotal ? Number(item.total) / orderSubtotal : 0;
        entry.tax += Number(o.taxTotal) * itemShare;
        entry.sales += Number(item.total);
        byClassAgg.set(key, entry);
      }
    }

    const bySellerAgg = new Map<string, number>();
    const sellers = await this.prisma.seller.findMany({ select: { id: true, shopName: true } });
    const sellerNameById = new Map(sellers.map((s) => [s.id, s.shopName]));
    for (const o of orders) {
      if (!o.sellerId) continue;
      bySellerAgg.set(o.sellerId, (bySellerAgg.get(o.sellerId) ?? 0) + Number(o.taxTotal));
    }

    return {
      kpis: {
        taxCollected,
        taxRefunded,
        netTaxLiability: taxCollected - taxRefunded,
        taxableSales,
        exemptSales: 0,
      },
      byClass: Array.from(byClassAgg.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.tax - a.tax),
      byCountry: Array.from(byCountryAgg.entries())
        .map(([country, v]) => ({ country, ...v }))
        .sort((a, b) => b.tax - a.tax)
        .slice(0, 10),
      bySeller: Array.from(bySellerAgg.entries())
        .map(([id, tax]) => ({ id, name: sellerNameById.get(id) ?? 'Unknown', tax }))
        .sort((a, b) => b.tax - a.tax),
      transactions: orders
        .filter((o) => Number(o.taxTotal) > 0)
        .slice(0, 50)
        .map((o) => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          date: o.createdAt,
          taxableAmount: Number(o.subtotal),
          taxAmount: Number(o.taxTotal),
          status: o.status,
        })),
    };
  }

  async getMarketingAnalytics(range?: string) {
    const { currentStart } = this.periodBounds(range);

    const [campaigns, newCustomers, abandonedCarts, orders] = await Promise.all([
      this.prisma.campaign.findMany({ where: { createdAt: { gte: currentStart } } }),
      this.prisma.customer.count({ where: { createdAt: { gte: currentStart } } }),
      this.prisma.abandonedCart.count({ where: { createdAt: { gte: currentStart } } }),
      this.prisma.order.findMany({ where: { createdAt: { gte: currentStart } }, select: { status: true } }),
    ]);

    const campaignRevenue = campaigns.reduce((s, c) => s + Number(c.revenue), 0);
    const marketingCost = campaigns.reduce((s, c) => s + Number(c.spend), 0);
    const roi = marketingCost ? Math.round(((campaignRevenue - marketingCost) / marketingCost) * 1000) / 10 : 0;
    const roas = marketingCost ? Math.round((campaignRevenue / marketingCost) * 100) / 100 : 0;
    const paidOrders = orders.filter((o) => !['CANCELLED', 'FAILED', 'DRAFT'].includes(o.status)).length;
    const cac = newCustomers ? Math.round((marketingCost / newCustomers) * 100) / 100 : 0;

    const channelAgg = new Map<string, number>();
    const typeAgg = new Map<string, number>();
    for (const c of campaigns) {
      const revenue = Number(c.revenue);
      const channels = c.channels.length ? c.channels : ['unassigned'];
      for (const ch of channels) {
        channelAgg.set(ch, (channelAgg.get(ch) ?? 0) + revenue / channels.length);
      }
      typeAgg.set(c.type, (typeAgg.get(c.type) ?? 0) + revenue);
    }

    return {
      kpis: {
        campaignRevenue,
        marketingCost,
        roi,
        roas,
        conversions: paidOrders,
        customerAcquisitionCost: cac,
      },
      revenueByChannel: Array.from(channelAgg.entries())
        .map(([channel, revenue]) => ({ channel, revenue: Math.round(revenue * 100) / 100 }))
        .sort((a, b) => b.revenue - a.revenue),
      campaignPerformance: campaigns
        .map((c) => ({
          id: c.id,
          name: c.name,
          revenue: Number(c.revenue),
          spend: Number(c.spend),
          budget: Number(c.budget),
          status: c.status,
        }))
        .sort((a, b) => b.revenue - a.revenue),
      attributionSources: Array.from(typeAgg.entries())
        .map(([type, revenue]) => ({ type, revenue: Math.round(revenue * 100) / 100 }))
        .sort((a, b) => b.revenue - a.revenue),
      funnel: {
        checkoutStarted: abandonedCarts + orders.length,
        orders: orders.length,
        paidOrders,
      },
    };
  }
}
