/**
 * Idempotent production seed for Halopeno.
 * - Removes unrelated marketplace / demo catalog data
 * - Upserts the real Halopeno flavors + gift set
 * - Ensures admin, brand, warehouse, and storefront coupons exist
 *
 * Safe to run on every deploy.
 */
import { PrismaClient, ProductStatus, ProductType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HALOPENO_SLUGS = [
  'zesty-crunch',
  'mustard-blaze',
  'citrus-kick',
  'vine-fire',
  'ruby-heat',
  'tahini-twist',
  'the-halopeno-set',
] as const;

const catalog = [
  {
    slug: 'zesty-crunch',
    name: 'Zesty Crunch',
    sku: 'HAL-ZC-200',
    category: 'flavors',
    price: 40,
    stock: 120,
    rating: 4.8,
    reviewCount: 214,
    description: 'Pickled lemon with red chilli and carrot for a refreshing, crunchy and zesty kick.',
    image: '/images/products/zesty-crunch.jpg',
  },
  {
    slug: 'mustard-blaze',
    name: 'Mustard Blaze',
    sku: 'HAL-MB-200',
    category: 'flavors',
    price: 40,
    stock: 95,
    rating: 4.7,
    reviewCount: 168,
    description: 'Green chilli with green mustard for a bold, zesty flavour mustard lovers will enjoy.',
    image: '/images/products/mustard-blaze.jpg',
  },
  {
    slug: 'citrus-kick',
    name: 'Citrus Kick',
    sku: 'HAL-CK-200',
    category: 'flavors',
    price: 35,
    stock: 110,
    rating: 4.6,
    reviewCount: 132,
    description: 'Green chilli and lemon for a bright, zesty and refreshing flavour.',
    image: '/images/products/citrus-kick.jpg',
  },
  {
    slug: 'vine-fire',
    name: 'Vine Fire',
    sku: 'HAL-VF-200',
    category: 'flavors',
    price: 35,
    stock: 105,
    rating: 4.7,
    reviewCount: 156,
    description: 'Green chilli and vine leaves in a traditional blend with an authentic Eastern touch.',
    image: '/images/products/vine-fire.jpg',
  },
  {
    slug: 'ruby-heat',
    name: 'Ruby Heat',
    sku: 'HAL-RH-200',
    category: 'flavors',
    price: 35,
    stock: 90,
    rating: 4.9,
    reviewCount: 187,
    description: 'Red chilli and beetroot for a spicy flavour and beautiful natural colour.',
    image: '/images/products/ruby-heat.jpg',
  },
  {
    slug: 'tahini-twist',
    name: 'Tahini Twist',
    sku: 'HAL-TT-200',
    category: 'flavors',
    price: 35,
    stock: 85,
    rating: 4.8,
    reviewCount: 121,
    description: 'Green chilli and tahini for a creamy, nutty and balanced flavour.',
    image: '/images/products/tahini-twist.jpg',
  },
  {
    slug: 'the-halopeno-set',
    name: 'The Halopeno Set',
    sku: 'HAL-SET-6X20',
    category: 'sets',
    price: 42,
    stock: 60,
    rating: 4.9,
    reviewCount: 96,
    description: 'Six bold flavours in small jars, perfect for tasting, sharing or gifting.',
    image: '/images/products/halopeno-set.jpg',
  },
] as const;

const HALOPENO_COUPONS = [
  { code: 'TRYALL20', discountType: 'PERCENTAGE' as const, discountValue: 20 },
  { code: 'FIRSTKICK', discountType: 'FIXED' as const, discountValue: 10, minOrderValue: 70 },
  { code: 'JAR4FREE', discountType: 'PERCENTAGE' as const, discountValue: 25 },
  { code: 'FREESHIP100', discountType: 'FIXED' as const, discountValue: 15, minOrderValue: 100 },
  { code: 'GIFTSET15', discountType: 'PERCENTAGE' as const, discountValue: 15 },
  { code: 'MONTHLYKICK', discountType: 'PERCENTAGE' as const, discountValue: 10 },
];

async function ensureBaseSetup() {
  await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', direction: 'ltr', isDefault: true, isActive: true },
      { code: 'ar', name: 'Arabic', direction: 'rtl', isDefault: false, isActive: true },
    ],
    skipDuplicates: true,
  });

  await prisma.currency.createMany({
    data: [
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', exchangeRate: 1, isDefault: true, isActive: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.27, isActive: true },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 0.98, isActive: true },
    ],
    skipDuplicates: true,
  });

  let company = await prisma.company.findFirst({
    where: { OR: [{ name: 'Halopeno' }, { email: 'hello@halopeno.com' }] },
  });
  if (!company) {
    const vantage = await prisma.company.findFirst({
      where: { OR: [{ name: { contains: 'Vantage' } }, { email: { contains: 'vantage' } }] },
    });
    if (vantage) {
      company = await prisma.company.update({
        where: { id: vantage.id },
        data: { name: 'Halopeno', legalName: 'Halopeno Foods', email: 'hello@halopeno.com', country: 'SA' },
      });
    } else {
      company = await prisma.company.create({
        data: { name: 'Halopeno', legalName: 'Halopeno Foods', email: 'hello@halopeno.com', country: 'SA' },
      });
    }
  }

  let store = await prisma.store.findFirst({ where: { companyId: company.id } });
  if (!store) {
    store = await prisma.store.findFirst();
  }
  if (store) {
    store = await prisma.store.update({
      where: { id: store.id },
      data: {
        companyId: company.id,
        name: 'Halopeno Store',
        domain: 'halopeno.com',
        currency: 'SAR',
        language: 'en',
      },
    });
  } else {
    store = await prisma.store.create({
      data: {
        companyId: company.id,
        name: 'Halopeno Store',
        domain: 'halopeno.com',
        currency: 'SAR',
        language: 'en',
      },
    });
  }

  const modules = ['products', 'orders', 'customers', 'sellers', 'marketing', 'finance', 'settings'];
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
  const permissions = await Promise.all(
    modules.flatMap((m) =>
      actions.map((a) =>
        prisma.permission.upsert({
          where: { code: `${m}.${a}` },
          update: {},
          create: { code: `${m}.${a}`, module: m, action: a, description: `${a} ${m}` },
        }),
      ),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: {
      name: 'Super Administrator',
      description: 'Full platform access',
      isSystem: true,
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
  });

  await prisma.role.upsert({
    where: { name: 'Support Agent' },
    update: {},
    create: { name: 'Support Agent', description: 'Handles tickets and customer queries', isSystem: true },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);
  for (const email of ['admin@halopeno.com', 'admin@vantage.dev']) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: 'Halopeno Admin',
          email,
          passwordHash,
          roleId: adminRole.id,
          jobTitle: 'Store Administrator',
          status: 'ACTIVE',
        },
      });
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: 'Halopeno Admin', roleId: adminRole.id, status: 'ACTIVE' },
      });
    }
  }

  return { store };
}

async function removeUnrelatedCatalog() {
  const junkProducts = await prisma.product.findMany({
    where: { slug: { notIn: [...HALOPENO_SLUGS] } },
    select: { id: true, slug: true },
  });
  const junkIds = junkProducts.map((p) => p.id);

  if (junkIds.length > 0) {
    console.log(`Removing ${junkIds.length} unrelated products...`);

    // OrderItem has no onDelete cascade — clear references first
    const junkOrderItems = await prisma.orderItem.findMany({
      where: { productId: { in: junkIds } },
      select: { orderId: true },
    });
    const affectedOrderIds = [...new Set(junkOrderItems.map((i) => i.orderId))];

    await prisma.orderItem.deleteMany({ where: { productId: { in: junkIds } } });

    // Drop marketplace demo orders (VG-*) and any orders left with no items
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'VG-' } } });

    for (const orderId of affectedOrderIds) {
      const remaining = await prisma.orderItem.count({ where: { orderId } });
      if (remaining === 0) {
        await prisma.refund.deleteMany({ where: { orderId } });
        await prisma.payment.deleteMany({ where: { orderId } });
        await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
      }
    }

    await prisma.review.deleteMany({ where: { productId: { in: junkIds } } }).catch(() => undefined);
    await prisma.product.deleteMany({ where: { id: { in: junkIds } } });
  }

  await prisma.order.updateMany({ data: { sellerId: null } });
  await prisma.product.updateMany({ data: { sellerId: null } });
  await prisma.seller.deleteMany({});

  await prisma.brand.deleteMany({ where: { slug: { not: 'halopeno' } } });
  await prisma.category.deleteMany({ where: { slug: { notIn: ['flavors', 'sets'] } } });

  // Old marketplace coupons that are not Halopeno offers
  await prisma.coupon.deleteMany({
    where: {
      code: { in: ['WELCOME10', 'FREESHIP', 'FLASH25', 'SAVE20'] },
    },
  });

  await prisma.deliveryAgent.deleteMany({});
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { body: { contains: 'Trail Running' } },
        { body: { contains: 'Coastal Goods' } },
        { title: { contains: 'Seller verification' } },
      ],
    },
  });
}

async function upsertCatalog(storeId: string) {
  const flavors = await prisma.category.upsert({
    where: { slug: 'flavors' },
    update: { name: 'Pickled Flavors', status: 'active', isFeatured: true, image: '🌶️', displayOrder: 1 },
    create: {
      name: 'Pickled Flavors',
      slug: 'flavors',
      image: '🌶️',
      status: 'active',
      isFeatured: true,
      displayOrder: 1,
    },
  });

  const sets = await prisma.category.upsert({
    where: { slug: 'sets' },
    update: { name: 'Gift Sets', status: 'active', isFeatured: true, image: '🎁', displayOrder: 2 },
    create: {
      name: 'Gift Sets',
      slug: 'sets',
      image: '🎁',
      status: 'active',
      isFeatured: true,
      displayOrder: 2,
    },
  });

  const categoryBySlug = new Map([
    ['flavors', flavors.id],
    ['sets', sets.id],
  ]);

  const brand = await prisma.brand.upsert({
    where: { slug: 'halopeno' },
    update: {
      name: 'Halopeno',
      status: 'active',
      isFeatured: true,
      description: 'Small Jar. Big Kick. Small-batch pickled jalapeño flavors.',
    },
    create: {
      name: 'Halopeno',
      slug: 'halopeno',
      description: 'Small Jar. Big Kick. Small-batch pickled jalapeño flavors.',
      status: 'active',
      isFeatured: true,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-RYD' },
    update: { name: 'Riyadh Kitchen Warehouse', city: 'Riyadh', country: 'SA', storeId, isActive: true },
    create: {
      name: 'Riyadh Kitchen Warehouse',
      code: 'WH-RYD',
      city: 'Riyadh',
      country: 'SA',
      storeId,
      isActive: true,
    },
  });

  // Remove old US/EU demo warehouses if empty
  const demoWarehouses = await prisma.warehouse.findMany({
    where: { code: { in: ['WH-CTRL', 'WH-WEST', 'WH-EU'] } },
    select: { id: true },
  });
  for (const wh of demoWarehouses) {
    await prisma.stockItem.deleteMany({ where: { warehouseId: wh.id } });
    await prisma.warehouse.delete({ where: { id: wh.id } }).catch(() => undefined);
  }

  for (const item of catalog) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sku: item.sku,
        categoryId: categoryBySlug.get(item.category),
        brandId: brand.id,
        sellerId: null,
        shortDescription: item.description,
        description: item.description,
        regularPrice: item.price,
        costPrice: Math.round(item.price * 0.45),
        stock: item.stock,
        rating: item.rating,
        reviewCount: item.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
        countryOfOrigin: 'SA',
      },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        type: 'SIMPLE' as ProductType,
        categoryId: categoryBySlug.get(item.category),
        brandId: brand.id,
        shortDescription: item.description,
        description: item.description,
        regularPrice: item.price,
        costPrice: Math.round(item.price * 0.45),
        stock: item.stock,
        reorderLevel: 15,
        rating: item.rating,
        reviewCount: item.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
        countryOfOrigin: 'SA',
      },
    });

    const image = await prisma.productImage.findFirst({
      where: { productId: product.id, displayOrder: 0 },
    });
    if (image) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: item.image, altText: item.name },
      });
    } else {
      await prisma.productImage.create({
        data: { productId: product.id, url: item.image, altText: item.name, displayOrder: 0 },
      });
    }

    const stockItem = await prisma.stockItem.findFirst({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    if (stockItem) {
      await prisma.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: item.stock, reserved: 0 },
      });
    } else {
      await prisma.stockItem.create({
        data: { productId: product.id, warehouseId: warehouse.id, quantity: item.stock, reserved: 0 },
      });
    }
  }

  for (const coupon of HALOPENO_COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: 'minOrderValue' in coupon ? coupon.minOrderValue : null,
        isActive: true,
      },
      create: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: 'minOrderValue' in coupon ? coupon.minOrderValue : null,
        isActive: true,
      },
    });
  }
}

async function main() {
  console.log('Halopeno production seed starting...');
  const { store } = await ensureBaseSetup();
  // Upsert catalog first so kept products point at flavors/sets before junk categories are removed
  await upsertCatalog(store.id);
  await removeUnrelatedCatalog();
  // Re-apply after cleanup in case images/stock were touched
  await upsertCatalog(store.id);

  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  console.log(`Halopeno production seed complete: ${productCount} products, ${categoryCount} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
