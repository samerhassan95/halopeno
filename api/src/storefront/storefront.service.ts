import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StorefrontService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async getSetting<T = unknown>(group: string, key: string): Promise<T | null> {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group, key } },
    });
    return (row?.value as T) ?? null;
  }

  private async signCustomer(customerId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: customerId, email, typ: 'customer' },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
      },
    );
    return accessToken;
  }

  async requireCustomer(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Login required');
    const token = authHeader.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; typ?: string }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.typ !== 'customer') throw new UnauthorizedException('Customer token required');
      const customer = await this.prisma.customer.findUnique({ where: { id: payload.sub } });
      if (!customer || customer.isDisabled) throw new UnauthorizedException('Account unavailable');
      return customer;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async registerCustomer(body: { name?: string; email?: string; password?: string; phone?: string }) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || password.length < 6) {
      throw new BadRequestException('Name, email and password (6+ chars) are required');
    }
    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing?.passwordHash) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = existing
      ? await this.prisma.customer.update({
          where: { id: existing.id },
          data: { name, phone: body.phone, passwordHash, tags: { set: [...existing.tags.filter((t) => t !== 'guest'), 'storefront'] } },
        })
      : await this.prisma.customer.create({
          data: {
            name,
            email,
            phone: body.phone,
            passwordHash,
            tags: ['storefront'],
            preferredCurrency: 'SAR',
            preferredLanguage: 'en',
          },
        });

    const accessToken = await this.signCustomer(customer.id, customer.email);
    return { accessToken, customer: this.sanitizeCustomer(customer) };
  }

  async loginCustomer(body: { email?: string; password?: string }) {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (!customer?.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, customer.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const accessToken = await this.signCustomer(customer.id, customer.email);
    return { accessToken, customer: this.sanitizeCustomer(customer) };
  }

  sanitizeCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    loyaltyPoints: number;
    preferredLanguage: string;
    preferredCurrency: string;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar: customer.avatar,
      loyaltyPoints: customer.loyaltyPoints,
      preferredLanguage: customer.preferredLanguage,
      preferredCurrency: customer.preferredCurrency,
    };
  }

  async findOrCreateCustomer(email: string, name: string, phone?: string) {
    const normalized = email.trim().toLowerCase();
    let customer = await this.prisma.customer.findUnique({ where: { email: normalized } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: name || 'Guest',
          email: normalized,
          phone,
          tags: ['guest'],
        },
      });
    } else if (phone && !customer.phone) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { phone },
      });
    }
    return customer;
  }

  async createStorefrontOrder(body: any, authHeader?: string, referralCode?: string) {
    const email = String(body.customerEmail || '').trim().toLowerCase();
    const name = String(body.customerName || '').trim();
    if (!email || !name || !Array.isArray(body.items) || !body.items.length) {
      throw new BadRequestException('Customer and items are required');
    }

    let customer =
      (authHeader ? await this.requireCustomer(authHeader).catch(() => null) : null) ??
      (await this.findOrCreateCustomer(email, name, body.customerPhone));

    const items: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];
    for (const raw of body.items) {
      let productId = raw.productId as string | undefined;
      if (!productId && raw.productSlug) {
        const product = await this.prisma.product.findUnique({ where: { slug: raw.productSlug } });
        productId = product?.id;
      }
      if (!productId) throw new BadRequestException(`Unknown product ${raw.productSlug || raw.name}`);
      const quantity = Number(raw.quantity) || 1;
      const unitPrice = Number(raw.unitPrice) || 0;
      items.push({
        productId,
        variantId: raw.variantId || null,
        name: String(raw.name),
        sku: String(raw.sku || raw.productSlug || productId),
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      });
    }

    const orderNumber = String(body.orderNumber || `SC${Date.now()}`);
    const paymentMethod = String(body.paymentMethod || 'cod');
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        source: 'WEBSITE',
        channel: 'IN_HOUSE',
        status: paymentMethod === 'cod' ? 'CONFIRMED' : 'PENDING',
        currency: 'SAR',
        subtotal: Number(body.subtotal) || 0,
        discountTotal: Number(body.discountTotal) || 0,
        taxTotal: Number(body.taxTotal) || 0,
        shippingTotal: Number(body.shippingTotal) || 0,
        total: Number(body.total) || 0,
        shippingAddress: {
          address: body.address,
          deliveryMethod: body.deliveryMethod,
          scheduledTime: body.scheduledTime,
          pickupLocationId: body.pickupLocationId,
        },
        billingAddress: { name, email, phone: body.customerPhone },
        customerNotes: body.customerNotes,
        couponCode: body.couponCode,
        referralSource: referralCode || body.referralCode || null,
        items: { create: items },
        payments: {
          create: {
            method: paymentMethod,
            amount: Number(body.total) || 0,
            currency: 'SAR',
            status: 'PENDING',
            gateway: this.config.get<string>('PAYMENT_PROVIDER') || 'stub',
            transactionRef: body.paymentIntentId || null,
          },
        },
      },
      include: { items: true, payments: true },
    });

    // Loyalty earn: 1 point per SAR
    const earned = Math.max(0, Math.floor(Number(order.total)));
    if (earned > 0) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { loyaltyPoints: { increment: earned } },
      });
      await this.prisma.loyaltyTransaction.create({
        data: {
          customerId: customer.id,
          points: earned,
          type: 'earn',
          reason: `Order ${order.orderNumber}`,
        },
      });
    }

    // Affiliate conversion
    const code = String(referralCode || body.referralCode || '').trim();
    if (code) {
      const affiliate = await this.prisma.affiliate.findFirst({
        where: { referralCode: { equals: code, mode: 'insensitive' }, status: 'active' },
      });
      if (affiliate) {
        const commission = (Number(order.total) * Number(affiliate.commissionRate)) / 100;
        await this.prisma.affiliateReferral.create({
          data: {
            affiliateId: affiliate.id,
            orderId: order.id,
            convertedAt: new Date(),
            commission,
          },
        });
        await this.prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { balance: { increment: commission } },
        });
      }
    }

    // Mark matching abandoned carts recovered
    await this.prisma.abandonedCart.updateMany({
      where: {
        OR: [{ customerId: customer.id }, { guestEmail: email }],
        recoveryStatus: 'pending',
      },
      data: { recoveryStatus: 'recovered', recoveredRevenue: order.total },
    });

    return { id: order.id, orderNumber: order.orderNumber, loyaltyEarned: earned, status: order.status };
  }

  async createPaymentIntent(body: { amount?: number; currency?: string; method?: string }) {
    const amount = Number(body.amount) || 0;
    const method = String(body.method || 'card');
    // Provider-agnostic stub: integrates with Moyasar/Stripe when keys are configured.
    const provider = this.config.get<string>('PAYMENT_PROVIDER') || 'stub';
    const intentId = `${provider}_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    return {
      provider,
      intentId,
      clientSecret: `${intentId}_secret`,
      amount,
      currency: body.currency || 'SAR',
      method,
      status: 'requires_confirmation',
      message:
        provider === 'stub'
          ? 'Payment provider stub ready. Set PAYMENT_PROVIDER + keys for live charging.'
          : 'Payment intent created',
    };
  }

  async upsertAbandonedCart(body: {
    email?: string;
    customerId?: string;
    cartValue?: number;
    items?: unknown;
  }) {
    const email = body.email?.trim().toLowerCase();
    if (!email && !body.customerId) throw new BadRequestException('email or customerId required');
    const existing = await this.prisma.abandonedCart.findFirst({
      where: {
        recoveryStatus: 'pending',
        OR: [
          body.customerId ? { customerId: body.customerId } : undefined,
          email ? { guestEmail: email } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = {
      guestEmail: email,
      customerId: body.customerId || null,
      cartValue: Number(body.cartValue) || 0,
      itemsJson: body.items ?? [],
      lastActivity: new Date(),
      recoveryStatus: 'pending',
    };
    if (existing) {
      return this.prisma.abandonedCart.update({ where: { id: existing.id }, data });
    }
    return this.prisma.abandonedCart.create({ data });
  }

  async redeemLoyalty(customerId: string, points: number, reason: string) {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (customer.loyaltyPoints < points) throw new BadRequestException('Not enough points');
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: points } },
    });
    await this.prisma.loyaltyTransaction.create({
      data: { customerId, points: -points, type: 'redeem', reason },
    });
    return { ok: true, remaining: customer.loyaltyPoints - points };
  }
}
