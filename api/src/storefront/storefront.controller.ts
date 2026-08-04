import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(private prisma: PrismaService) {}

  private async getSetting<T = unknown>(group: string, key: string): Promise<T | null> {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group, key } },
    });
    return (row?.value as T) ?? null;
  }

  @Public()
  @Get('homepage-sections')
  @ApiOperation({ summary: 'Public published homepage sections' })
  async getHomepageSections() {
    const value = await this.getSetting('storefront', 'homepage_sections');
    return { value };
  }

  @Public()
  @Get('global-styles')
  @ApiOperation({ summary: 'Public brand style overrides' })
  async getGlobalStyles() {
    const value = await this.getSetting('storefront', 'global_styles');
    return { value };
  }

  @Public()
  @Get('active-theme')
  @ApiOperation({ summary: 'Public active storefront theme' })
  async getActiveTheme() {
    const value = await this.getSetting('storefront', 'active_theme');
    return { value: value ?? { id: 'classic' } };
  }

  @Public()
  @Get('header')
  async getHeader() {
    return { value: await this.getSetting('storefront', 'header') };
  }

  @Public()
  @Get('footer')
  async getFooter() {
    return { value: await this.getSetting('storefront', 'footer') };
  }

  @Public()
  @Get('site-settings')
  @ApiOperation({ summary: 'Public site SEO, currency, maintenance and payment display settings' })
  async getSiteSettings() {
    const [system, payments, loyalty, currency] = await Promise.all([
      this.getSetting<Record<string, unknown>>('system', 'storefront'),
      this.getSetting<Record<string, unknown>>('storefront', 'payment_methods'),
      this.getSetting<Record<string, unknown>>('storefront', 'loyalty_program'),
      this.getSetting<Record<string, unknown>>('storefront', 'currency'),
    ]);
    return {
      value: {
        siteName: system?.siteName ?? 'Halopeno',
        tagline: system?.tagline ?? 'Small Jar. Big Kick.',
        metaTitle: system?.metaTitle ?? null,
        metaDescription: system?.metaDescription ?? null,
        maintenanceMode: Boolean(system?.maintenanceMode),
        maintenanceMessage:
          system?.maintenanceMessage ?? 'We are updating the kitchen. Back shortly.',
        currencyCode: (currency?.code as string) ?? 'SAR',
        currencySymbol: (currency?.symbol as string) ?? 'SAR',
        paymentMethods: Array.isArray(payments?.methods)
          ? payments!.methods
          : [
              { id: 'cod', label: 'Cash on Delivery', enabled: true },
              { id: 'card', label: 'Card', enabled: true },
              { id: 'apple_pay', label: 'Apple Pay', enabled: true },
              { id: 'google_pay', label: 'Google Pay', enabled: true },
              { id: 'wallet', label: 'Wallet', enabled: false },
            ],
        loyalty: loyalty ?? null,
      },
    };
  }

  @Public()
  @Get('menus')
  async getMenus(@Query('location') location?: string) {
    const menus = await this.prisma.menu.findMany({
      where: location ? { location } : undefined,
      orderBy: { name: 'asc' },
    });
    return { data: menus };
  }

  @Public()
  @Get('banners')
  async getBanners(@Query('placement') placement?: string) {
    const now = new Date();
    const banners = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
    return { data: banners };
  }

  @Public()
  @Get('popups')
  async getPopups() {
    const popups = await this.prisma.popup.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: popups };
  }

  @Public()
  @Get('promotions')
  async getPromotions() {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
    return { data: promotions };
  }

  @Public()
  @Get('flash-deals')
  async getFlashDeals() {
    const now = new Date();
    const deals = await this.prisma.flashDeal.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: 'asc' },
      take: 12,
    });
    return {
      data: deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        banner: deal.banner,
        discountValue: Number(deal.discountValue),
        startsAt: deal.startsAt,
        endsAt: deal.endsAt,
        stockAllocated: deal.stockAllocated,
      })),
    };
  }

  @Public()
  @Get('coupons')
  async getCoupons() {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      data: coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderValue: coupon.minOrderValue == null ? null : Number(coupon.minOrderValue),
        maxDiscount: coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
        expiresAt: coupon.expiresAt,
      })),
    };
  }

  @Public()
  @Post('coupons/validate')
  async validateCoupon(@Body() body: { code?: string; subtotal?: number }) {
    const code = String(body?.code || '')
      .trim()
      .toUpperCase();
    if (!code) return { valid: false, message: 'Coupon code is required' };

    const now = new Date();
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
    });

    if (!coupon) return { valid: false, message: 'Invalid or expired coupon' };
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    const subtotal = Number(body?.subtotal || 0);
    const minOrder = coupon.minOrderValue == null ? 0 : Number(coupon.minOrderValue);
    if (subtotal < minOrder) {
      return { valid: false, message: `Minimum order value is ${minOrder}` };
    }

    const discountValue = Number(coupon.discountValue);
    let discountPct = 0;
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountPct = discountValue;
      discountAmount = (subtotal * discountValue) / 100;
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = discountValue;
      discountPct = subtotal > 0 ? Math.min(100, (discountValue / subtotal) * 100) : 0;
    }

    if (coupon.maxDiscount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue,
        discountPct: Math.round(discountPct * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        freeShipping: coupon.discountType === 'FREE_SHIPPING',
      },
    };
  }

  @Public()
  @Post('checkout/quote')
  @ApiOperation({ summary: 'Calculate delivery fee and tax from admin shipping/tax rules' })
  async checkoutQuote(@Body() body: { subtotal?: number; country?: string; city?: string }) {
    const subtotal = Number(body?.subtotal || 0);
    const country = (body?.country || 'SA').toUpperCase();

    const zones = await this.prisma.shippingZone.findMany({
      include: { rates: true },
      orderBy: { createdAt: 'asc' },
    });
    const matched =
      zones.find((zone) => zone.countries.some((c) => c.toUpperCase() === country || c === '*')) ??
      zones[0];

    let deliveryFee = 15;
    let freeThreshold = 150;
    if (matched?.rates?.length) {
      const rate =
        matched.rates.find((r) => r.minOrderValue == null || Number(r.minOrderValue) <= subtotal) ??
        matched.rates[0];
      deliveryFee = Number(rate.amount);
      if (rate.freeShippingThreshold != null) freeThreshold = Number(rate.freeShippingThreshold);
      if (subtotal >= freeThreshold) deliveryFee = 0;
    } else if (subtotal >= freeThreshold || subtotal === 0) {
      deliveryFee = 0;
    }

    const taxRates = await this.prisma.taxRate.findMany({
      where: { OR: [{ country }, { country: 'SA' }, { country: '*' }] },
      orderBy: { rate: 'desc' },
      take: 1,
    });
    const taxRate = taxRates[0] ? Number(taxRates[0].rate) / (Number(taxRates[0].rate) > 1 ? 100 : 1) : 0.15;

    return {
      deliveryFee,
      freeThreshold,
      taxRate,
      taxAmount: Math.round(subtotal * taxRate * 100) / 100,
      currency: 'SAR',
    };
  }

  @Public()
  @Get('brands')
  async getBrands() {
    const brands = await this.prisma.brand.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      take: 100,
    });
    return {
      data: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        isFeatured: brand.isFeatured,
      })),
    };
  }

  @Public()
  @Get('collections')
  async getCollections() {
    const collections = await this.prisma.collection.findMany({
      where: { status: { not: 'inactive' } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: collections };
  }

  @Public()
  @Get('collections/:slug')
  async getCollection(@Param('slug') slug: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, status: { not: 'inactive' } },
    });
    return { data: collection };
  }

  @Public()
  @Get('pages')
  async getPages() {
    const pages = await this.prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
      },
    });
    return { data: pages };
  }

  @Public()
  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
    return { data: page };
  }

  @Public()
  @Get('faq')
  async getFaq() {
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { data: articles };
  }

  @Public()
  @Post('contact')
  async submitContact(
    @Body() body: { name?: string; email?: string; subject?: string; message?: string },
  ) {
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const message = String(body?.message || '').trim();
    if (!name || !email || !message) {
      return { ok: false, message: 'Name, email and message are required' };
    }
    const created = await this.prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: body.subject?.trim() || null,
        message,
        status: 'new',
      },
    });
    return { ok: true, id: created.id };
  }

  @Public()
  @Post('newsletter')
  async subscribeNewsletter(@Body() body: { email?: string; name?: string }) {
    const email = String(body?.email || '').trim();
    if (!email) return { ok: false, message: 'Email is required' };
    const created = await this.prisma.contactMessage.create({
      data: {
        name: body?.name?.trim() || 'Newsletter',
        email,
        subject: 'Newsletter subscription',
        message: 'Please add this email to the Halopeno newsletter list.',
        status: 'new',
      },
    });
    return { ok: true, id: created.id };
  }

  @Public()
  @Get('blog-posts')
  async getBlogPosts(@Query('limit') limit?: string) {
    const take = Math.min(50, Math.max(1, Number(limit) || 12));
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      include: { category: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take,
    });
    return {
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        author: post.author ?? 'Halopeno Team',
        content: post.content ?? '',
        excerpt: (post.content ?? '').slice(0, 160),
        image: post.featuredImage ?? '',
        category: post.category?.name ?? 'Journal',
        date: (post.publishedAt ?? post.createdAt).toISOString(),
        readTime: `${Math.max(1, Math.ceil(((post.content ?? '').split(/\s+/).filter(Boolean).length || 200) / 200))} min read`,
      })),
    };
  }

  @Public()
  @Get('blog-posts/:slug')
  async getBlogPost(@Param('slug') slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { category: true },
    });
    if (!post) return { data: null };
    return {
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        author: post.author ?? 'Halopeno Team',
        content: post.content ?? '',
        excerpt: (post.content ?? '').slice(0, 160),
        image: post.featuredImage ?? '',
        category: post.category?.name ?? 'Journal',
        date: (post.publishedAt ?? post.createdAt).toISOString(),
        readTime: `${Math.max(1, Math.ceil(((post.content ?? '').split(/\s+/).filter(Boolean).length || 200) / 200))} min read`,
      },
    };
  }

  @Public()
  @Get('reviews')
  async getReviews(@Query('limit') limit?: string, @Query('productId') productId?: string) {
    const take = Math.min(50, Math.max(1, Number(limit) || 8));
    const reviews = await this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        ...(productId ? { productId } : {}),
      },
      include: { customer: true },
      orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
      take,
    });
    return {
      data: reviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        customerId: review.customerId,
        customerName: review.customer?.name ?? 'Verified Customer',
        rating: review.rating,
        title: review.title,
        body: review.body,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
      })),
    };
  }

  @Public()
  @Get('products/:productId/questions')
  async getProductQuestions(@Param('productId') productId: string) {
    const questions = await this.prisma.productQuestion.findMany({
      where: {
        productId,
        isPublic: true,
        answer: { not: null },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return {
      data: questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        customerName: q.customer?.name ?? 'Customer',
        createdAt: q.createdAt,
      })),
    };
  }

  @Public()
  @Post('products/:productId/questions')
  async askProductQuestion(
    @Param('productId') productId: string,
    @Body() body: { name?: string; email?: string; question?: string },
  ) {
    const question = String(body?.question || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const name = String(body?.name || '').trim() || 'Guest';
    if (!question || !email) return { ok: false, message: 'Email and question are required' };

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { ok: false, message: 'Product not found' };

    let customer = await this.prisma.customer.findFirst({ where: { email } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name,
          email,
          tags: ['storefront-question'],
        },
      });
    }

    const created = await this.prisma.productQuestion.create({
      data: {
        productId,
        customerId: customer.id,
        question,
        isPublic: true,
        status: 'pending',
      },
    });
    return { ok: true, id: created.id };
  }

  @Public()
  @Get('loyalty')
  async getLoyalty() {
    const program = await this.getSetting<Record<string, unknown>>('storefront', 'loyalty_program');
    const recent = await this.prisma.loyaltyTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { customer: true },
    });
    return {
      program: program ?? {
        tiers: [
          { name: 'Bronze', min: 0, perk: '5% birthday reward' },
          { name: 'Silver', min: 500, perk: 'Free delivery on weekends' },
          { name: 'Gold', min: 1000, perk: '10% off every 5th order' },
          { name: 'Platinum', min: 2500, perk: 'Priority support + exclusive tastings' },
        ],
        rewards: [
          { id: 'r1', title: 'SAR 5 Off', points: 300 },
          { id: 'r2', title: 'SAR 15 Off', points: 900 },
          { id: 'r3', title: 'Free delivery', points: 400 },
        ],
      },
      recentActivity: recent.map((row) => ({
        id: row.id,
        label: row.reason ?? row.type,
        points: row.points,
        date: row.createdAt,
        customerName: row.customer?.name ?? 'Member',
      })),
    };
  }
}
