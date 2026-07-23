import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsSummaryService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [payments, shipments, webhookLogs, webhooks, connections] = await Promise.all([
      this.prisma.payment.findMany({ select: { method: true, gateway: true, status: true, amount: true, gatewayFee: true } }),
      this.prisma.shipment.findMany({
        select: { status: true, carrierId: true, carrier: { select: { name: true } } },
      }),
      this.prisma.webhookLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { webhook: { select: { url: true, events: true } } },
      }),
      this.prisma.webhook.findMany({ select: { id: true, url: true, isActive: true } }),
      this.prisma.integrationConnection.findMany(),
    ]);

    const totalPayments = payments.length;
    const successfulPayments = payments.filter((p) => p.status === 'PAID').length;
    const paymentSuccessRate = totalPayments ? Math.round((successfulPayments / totalPayments) * 1000) / 10 : 0;
    const totalVolume = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalFees = payments.reduce((s, p) => s + Number(p.gatewayFee), 0);

    const gatewayAgg = new Map<string, { count: number; volume: number }>();
    for (const p of payments) {
      const key = p.gateway ?? p.method;
      const e = gatewayAgg.get(key) ?? { count: 0, volume: 0 };
      e.count += 1;
      e.volume += Number(p.amount);
      gatewayAgg.set(key, e);
    }
    const byGateway = Array.from(gatewayAgg.entries())
      .map(([gateway, v]) => ({ gateway, ...v }))
      .sort((a, b) => b.volume - a.volume);

    const totalShipments = shipments.length;
    const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED').length;
    const failedShipments = shipments.filter((s) => s.status === 'FAILED').length;
    const shippingSuccessRate = totalShipments ? Math.round((deliveredShipments / totalShipments) * 1000) / 10 : 0;

    const carrierAgg = new Map<string, { total: number; delivered: number }>();
    for (const s of shipments) {
      const key = s.carrier?.name ?? 'Unassigned';
      const e = carrierAgg.get(key) ?? { total: 0, delivered: 0 };
      e.total += 1;
      if (s.status === 'DELIVERED') e.delivered += 1;
      carrierAgg.set(key, e);
    }
    const byCarrier = Array.from(carrierAgg.entries())
      .map(([carrier, v]) => ({
        carrier,
        shipments: v.total,
        successRate: v.total ? Math.round((v.delivered / v.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.shipments - a.shipments);

    const totalDeliveries = webhookLogs.length;
    const successfulDeliveries = webhookLogs.filter((l) => l.success).length;
    const webhookSuccessRate = totalDeliveries ? Math.round((successfulDeliveries / totalDeliveries) * 1000) / 10 : 0;

    return {
      payments: {
        kpis: {
          totalTransactions: totalPayments,
          successRate: paymentSuccessRate,
          totalVolume,
          totalFees,
        },
        byGateway,
      },
      shipping: {
        kpis: {
          totalShipments,
          successRate: shippingSuccessRate,
          failed: failedShipments,
        },
        byCarrier,
      },
      webhooks: {
        kpis: {
          activeWebhooks: webhooks.filter((w) => w.isActive).length,
          totalWebhooks: webhooks.length,
          totalDeliveries,
          successRate: webhookSuccessRate,
        },
        deliveries: webhookLogs.slice(0, 50).map((l) => ({
          id: l.id,
          webhookUrl: l.webhook.url,
          event: l.event,
          statusCode: l.statusCode,
          success: l.success,
          attempt: l.attempt,
          createdAt: l.createdAt,
        })),
      },
      apiConnections: connections.map((c) => ({
        id: c.id,
        provider: c.provider,
        category: c.category,
        status: c.status,
        lastSyncAt: c.lastSyncAt,
      })),
    };
  }
}
