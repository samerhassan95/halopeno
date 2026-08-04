import { NotFoundException } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorefrontService } from './storefront.service';

@ApiTags('Storefront Extra')
@Controller('storefront')
export class StorefrontExtraController {
  constructor(
    private prisma: PrismaService,
    private storefront: StorefrontService,
  ) {}

  // ---- Auth ----
  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a storefront customer account' })
  register(@Body() body: { name?: string; email?: string; password?: string; phone?: string }) {
    return this.storefront.registerCustomer(body);
  }

  @Public()
  @Post('auth/login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.storefront.loginCustomer(body);
  }

  @Public()
  @Get('account/me')
  async me(@Headers('authorization') auth?: string) {
    const customer = await this.storefront.requireCustomer(auth);
    return { data: this.storefront.sanitizeCustomer(customer) };
  }

  @Public()
  @Get('account/orders')
  async myOrders(@Headers('authorization') auth?: string) {
    const customer = await this.storefront.requireCustomer(auth);
    const orders = await this.prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      data: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        paymentMethod: order.payments[0]?.method ?? null,
      })),
    };
  }

  @Public()
  @Get('account/addresses')
  async myAddresses(@Headers('authorization') auth?: string) {
    const customer = await this.storefront.requireCustomer(auth);
    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: { isDefault: 'desc' },
    });
    return { data: addresses };
  }

  @Public()
  @Post('account/addresses')
  async addAddress(
    @Headers('authorization') auth: string | undefined,
    @Body()
    body: {
      label?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      phone?: string;
      isDefault?: boolean;
    },
  ) {
    const customer = await this.storefront.requireCustomer(auth);
    if (body.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }
    const address = await this.prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: body.label || 'home',
        line1: String(body.line1 || ''),
        line2: body.line2,
        city: String(body.city || ''),
        state: body.state,
        country: body.country || 'SA',
        postalCode: body.postalCode,
        phone: body.phone,
        isDefault: Boolean(body.isDefault),
      },
    });
    return { data: address };
  }

  @Public()
  @Get('account/loyalty')
  async myLoyalty(@Headers('authorization') auth?: string) {
    const customer = await this.storefront.requireCustomer(auth);
    const history = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return {
      points: customer.loyaltyPoints,
      history: history.map((row) => ({
        id: row.id,
        points: row.points,
        type: row.type,
        reason: row.reason,
        date: row.createdAt,
      })),
    };
  }

  @Public()
  @Post('account/loyalty/redeem')
  async redeemLoyalty(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { points?: number; reason?: string },
  ) {
    const customer = await this.storefront.requireCustomer(auth);
    const points = Math.max(1, Number(body.points) || 0);
    return this.storefront.redeemLoyalty(customer.id, points, body.reason || 'Reward redemption');
  }

  @Public()
  @Get('account/digital-downloads')
  async digitalDownloads(@Headers('authorization') auth?: string) {
    const customer = await this.storefront.requireCustomer(auth);
    const orders = await this.prisma.order.findMany({
      where: { customerId: customer.id, status: { notIn: ['CANCELLED'] } },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const downloads: Array<{
      orderNumber: string;
      productName: string;
      fileName: string;
      url: string;
    }> = [];
    for (const order of orders) {
      for (const item of order.items) {
        const config = ((item.product as any).digitalConfig || null) as {
          files?: Array<{ name?: string; url?: string }>;
        } | null;
        if (!config?.files?.length) continue;
        for (const file of config.files) {
          if (!file.url) continue;
          downloads.push({
            orderNumber: order.orderNumber,
            productName: item.name,
            fileName: file.name || 'Download',
            url: file.url,
          });
        }
      }
    }
    return { data: downloads };
  }

  @Public()
  @Post('account/refunds')
  async requestRefund(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { orderId?: string; amount?: number; reason?: string },
  ) {
    const customer = await this.storefront.requireCustomer(auth);
    const order = await this.prisma.order.findFirst({
      where: { id: body.orderId, customerId: customer.id },
    });
    if (!order) return { ok: false, message: 'Order not found' };
    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        amount: body.amount != null ? Number(body.amount) : Number(order.total),
        reason: body.reason || 'Customer request',
        status: 'PENDING',
      },
    });
    await this.prisma.return.create({
      data: {
        orderId: order.id,
        reason: body.reason || 'Customer request',
        status: 'REQUESTED',
      },
    });
    return { ok: true, id: refund.id };
  }

  @Public()
  @Post('orders')
  @ApiOperation({ summary: 'Place a storefront order (also available as legacy sync target)' })
  placeOrder(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') auth?: string,
    @Headers('x-referral-code') referral?: string,
  ) {
    return this.storefront.createStorefrontOrder(body, auth, referral);
  }

  @Public()
  @Post('payments/intent')
  createPaymentIntent(@Body() body: { amount?: number; currency?: string; method?: string }) {
    return this.storefront.createPaymentIntent(body);
  }

  @Public()
  @Post('abandoned-carts')
  saveAbandonedCart(
    @Body() body: { email?: string; customerId?: string; cartValue?: number; items?: unknown },
  ) {
    return this.storefront.upsertAbandonedCart(body);
  }

  @Public()
  @Get('pickup-locations')
  async pickupLocations() {
    const rows = await this.prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { data: rows };
  }

  @Public()
  @Get('attributes')
  async attributes() {
    const attributes = await this.prisma.attribute.findMany({
      where: { isFilterable: true },
      include: { values: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    return {
      data: attributes.map((attr) => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        values: attr.values.map((value) => ({
          id: value.id,
          value: value.value,
          colorHex: value.colorHex,
        })),
      })),
    };
  }

  @Public()
  @Get('currencies')
  async currencies() {
    const rows = await this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
    return {
      data: rows.map((row) => ({
        code: row.code,
        name: row.name,
        symbol: row.symbol,
        exchangeRate: Number(row.exchangeRate),
        isDefault: row.isDefault,
      })),
    };
  }

  @Public()
  @Get('languages')
  async languages() {
    const rows = await this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
    return { data: rows };
  }

  @Public()
  @Get('sellers')
  async sellers() {
    const sellers = await this.prisma.seller.findMany({
      where: { status: 'APPROVED' },
      orderBy: { shopName: 'asc' },
      take: 50,
    });
    return {
      data: sellers.map((seller) => ({
        id: seller.id,
        storeName: seller.shopName,
        slug: seller.id,
        logo: seller.logo,
        rating: Number(seller.rating),
      })),
    };
  }

  @Public()
  @Get('sellers/:id')
  async seller(@Param('id') id: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { id, status: 'APPROVED' },
    });
    if (!seller) return { data: null };
    const products = await this.prisma.product.findMany({
      where: { sellerId: seller.id, status: 'PUBLISHED' },
      include: { images: true },
      take: 48,
    });
    return {
      data: {
        id: seller.id,
        storeName: seller.shopName,
        slug: seller.id,
        logo: seller.logo,
        rating: Number(seller.rating),
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.salePrice ?? p.regularPrice),
          image: p.images[0]?.url ?? '',
        })),
      },
    };
  }

  @Public()
  @Get('auctions')
  async auctions() {
    const now = new Date();
    const rows = await this.prisma.auctionDetail.findMany({
      where: {
        status: { in: ['scheduled', 'live', 'active'] },
        endAt: { gte: now },
      },
      include: {
        product: { include: { images: true } },
        bids: { orderBy: { amount: 'desc' }, take: 1 },
      },
      orderBy: { endAt: 'asc' },
      take: 24,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.product.name,
        productSlug: row.product.slug,
        image: row.product.images[0]?.url ?? '',
        startingBid: Number(row.startingBid),
        currentBid: row.bids[0] ? Number(row.bids[0].amount) : Number(row.startingBid),
        minIncrement: Number(row.minIncrement),
        startAt: row.startAt,
        endAt: row.endAt,
        status: row.status,
      })),
    };
  }

  @Public()
  @Post('auctions/:id/bids')
  async placeBid(
    @Param('id') id: string,
    @Headers('authorization') auth: string | undefined,
    @Body() body: { amount?: number },
  ) {
    const customer = await this.storefront.requireCustomer(auth);
    const auction = await this.prisma.auctionDetail.findUnique({
      where: { id },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
    });
    if (!auction) throw new NotFoundException('Auction not found');
    const amount = Number(body.amount);
    const current = auction.bids[0] ? Number(auction.bids[0].amount) : Number(auction.startingBid);
    const min = current + Number(auction.minIncrement);
    if (!amount || amount < min) {
      return { ok: false, message: `Bid must be at least ${min}` };
    }
    const bid = await this.prisma.bid.create({
      data: { auctionId: id, customerId: customer.id, amount, isAuto: false },
    });
    await this.prisma.auctionDetail.update({
      where: { id },
      data: { status: 'live' },
    });
    return { ok: true, bid: { id: bid.id, amount: Number(bid.amount) } };
  }

  @Public()
  @Get('preorders')
  async preorders() {
    const now = new Date();
    const rows = await this.prisma.preorderDetail.findMany({
      where: {
        status: 'active',
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: { product: { include: { images: true } } },
      take: 24,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.product.name,
        productSlug: row.product.slug,
        image: row.product.images[0]?.url ?? '',
        expectedAvailable: row.expectedAvailable,
        depositAmount: row.depositAmount == null ? null : Number(row.depositAmount),
        maxQuantity: row.maxQuantity,
        endAt: row.endAt,
      })),
    };
  }

  @Public()
  @Get('wholesale')
  async wholesale() {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: { images: true },
      take: 100,
    });
    return {
      data: products
        .filter((p) => Boolean((p as any).wholesaleConfig))
        .slice(0, 48)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images[0]?.url ?? '',
          wholesalePrice: p.wholesalePrice == null ? null : Number(p.wholesalePrice),
          wholesaleConfig: (p as any).wholesaleConfig,
        })),
    };
  }

  @Public()
  @Post('affiliate/click')
  async affiliateClick(@Body() body: { code?: string }) {
    const code = String(body.code || '').trim();
    if (!code) return { ok: false };
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { referralCode: { equals: code, mode: 'insensitive' }, status: 'active' },
    });
    if (!affiliate) return { ok: false };
    await this.prisma.affiliateReferral.create({
      data: { affiliateId: affiliate.id },
    });
    return { ok: true, code: affiliate.referralCode, name: affiliate.name };
  }

  @Public()
  @Get('affiliate/:code')
  async affiliateByCode(@Param('code') code: string) {
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { referralCode: { equals: code, mode: 'insensitive' }, status: 'active' },
    });
    if (!affiliate) return { data: null };
    return {
      data: {
        name: affiliate.name,
        referralCode: affiliate.referralCode,
        commissionRate: Number(affiliate.commissionRate),
      },
    };
  }

  @Public()
  @Post('reviews')
  async submitReview(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { productId?: string; rating?: number; title?: string; body?: string; email?: string; name?: string },
  ) {
    let customerId: string | null = null;
    try {
      const customer = await this.storefront.requireCustomer(auth);
      customerId = customer.id;
    } catch {
      if (!body.email) return { ok: false, message: 'Login or email required' };
      const customer = await this.storefront.findOrCreateCustomer(body.email, body.name || 'Customer');
      customerId = customer.id;
    }
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    if (!body.productId) return { ok: false, message: 'productId required' };
    const review = await this.prisma.review.create({
      data: {
        productId: body.productId,
        customerId: customerId!,
        rating,
        title: body.title,
        body: body.body,
        status: 'PENDING',
        isVerified: false,
      },
    });
    return { ok: true, id: review.id, message: 'Review submitted for approval' };
  }

  @Public()
  @Post('chat')
  async chat(
    @Body() body: { name?: string; email?: string; message?: string; sessionId?: string },
  ) {
    const message = String(body.message || '').trim();
    if (!message) return { ok: false, message: 'Message required' };
    const created = await this.prisma.contactMessage.create({
      data: {
        name: body.name?.trim() || 'Guest',
        email: body.email?.trim() || 'chat@halopeno.guest',
        subject: `Live chat ${body.sessionId || ''}`.trim(),
        message,
        status: 'new',
      },
    });
    return {
      ok: true,
      id: created.id,
      reply: 'Thanks! Our team received your message and will reply shortly during support hours.',
    };
  }

  @Public()
  @Get('chat/:sessionId')
  async chatHistory(@Param('sessionId') sessionId: string) {
    const rows = await this.prisma.contactMessage.findMany({
      where: { subject: { contains: sessionId } },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        from: 'customer',
        message: row.message,
        createdAt: row.createdAt,
      })),
    };
  }
}
