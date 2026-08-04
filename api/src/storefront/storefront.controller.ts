import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('homepage-sections')
  @ApiOperation({ summary: 'Public read-only homepage section layout for the storefront' })
  async getHomepageSections() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'homepage_sections' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('global-styles')
  @ApiOperation({ summary: 'Public read-only brand color/radius overrides for the storefront theme' })
  async getGlobalStyles() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'global_styles' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('active-theme')
  @ApiOperation({ summary: 'Public active storefront theme identifier and deployment metadata' })
  async getActiveTheme() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'active_theme' } },
    });
    return { value: row?.value ?? { id: 'classic' } };
  }

  @Public()
  @Get('header')
  @ApiOperation({ summary: 'Public header configuration' })
  async getHeader() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'header' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('footer')
  @ApiOperation({ summary: 'Public footer configuration' })
  async getFooter() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'footer' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('menus')
  @ApiOperation({ summary: 'Public navigation menus' })
  async getMenus(@Query('location') location?: string) {
    const menus = await this.prisma.menu.findMany({
      where: location ? { location } : undefined,
      orderBy: { name: 'asc' },
    });
    return { data: menus };
  }

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Public active banners' })
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
  @ApiOperation({ summary: 'Public active popups' })
  async getPopups() {
    const popups = await this.prisma.popup.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: popups };
  }

  @Public()
  @Get('promotions')
  @ApiOperation({ summary: 'Public active promotions used as storefront offers' })
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
  @Get('coupons')
  @ApiOperation({ summary: 'Public active coupon codes for storefront checkout' })
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
  @ApiOperation({ summary: 'Validate a coupon code for the storefront cart' })
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
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      discountPct = 0;
      discountAmount = 0;
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
  @Get('blog-posts')
  @ApiOperation({ summary: 'Public published blog posts' })
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
  @ApiOperation({ summary: 'Public published blog post by slug' })
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
  @ApiOperation({ summary: 'Public approved product reviews' })
  async getReviews(@Query('limit') limit?: string) {
    const take = Math.min(50, Math.max(1, Number(limit) || 8));
    const reviews = await this.prisma.review.findMany({
      where: { status: 'APPROVED' },
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
}
