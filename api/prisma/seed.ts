import { PrismaClient, ProductStatus, ProductType, OrderStatus, OrderChannel, OrderSource, PaymentStatus, SellerStatus, TicketStatus, TicketPriority } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
faker.seed(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding...');

  // --- Languages & Currencies ---
  await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', direction: 'ltr', isDefault: true, isActive: true },
      { code: 'ar', name: 'Arabic', direction: 'rtl', isDefault: false, isActive: true },
    ],
    skipDuplicates: true,
  });
  await prisma.currency.createMany({
    data: [
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isDefault: true, isActive: true },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isActive: true },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.78, isActive: true },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67, isActive: true },
    ],
    skipDuplicates: true,
  });

  // --- Company & Store ---
  const company = await prisma.company.create({
    data: { name: 'Vantage Commerce Inc.', legalName: 'Vantage Commerce Inc.', email: 'ops@vantage.dev', country: 'US' },
  });
  const store = await prisma.store.create({
    data: { companyId: company.id, name: 'Vantage Flagship Store', domain: 'vantage-flagship.dev', currency: 'USD', language: 'en' },
  });

  // --- Permissions & Roles ---
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
  const supportRole = await prisma.role.upsert({
    where: { name: 'Support Agent' },
    update: {},
    create: { name: 'Support Agent', description: 'Handles tickets and customer queries', isSystem: true },
  });

  // --- Users (staff) ---
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminEmail = 'admin@vantage.dev';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: { name: 'Sarah Kim', email: adminEmail, passwordHash, roleId: adminRole.id, jobTitle: 'Platform Administrator', status: 'ACTIVE' },
    });
  }
  const staffNames = ['Marcus Lee', 'Priya Nandan', 'Theo Vance', 'Ines Farah'];
  for (const name of staffNames) {
    const email = faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, roleId: supportRole.id, department: pick(['Support', 'Marketing', 'Operations']), status: 'ACTIVE' },
    });
  }

  // --- Categories ---
  const categoryDefs = [
    { name: 'Electronics', image: '📱' },
    { name: 'Fashion', image: '👗' },
    { name: 'Home & Living', image: '🛋️' },
    { name: 'Beauty & Care', image: '💄' },
    { name: 'Sports & Outdoors', image: '🏀' },
    { name: 'Groceries', image: '🛒' },
    { name: 'Toys & Kids', image: '🧸' },
    { name: 'Books & Media', image: '📚' },
  ];
  const categories = [];
  for (const c of categoryDefs) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    categories.push(
      await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name: c.name, slug, image: c.image, status: 'active', isFeatured: Math.random() > 0.6 },
      }),
    );
  }

  // --- Brands ---
  const brandNames = ['Nordwell', 'Lucent', 'Kaelo', 'Verra', 'Solace Co.', 'Meridian Goods'];
  const brands = [];
  for (const name of brandNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    brands.push(await prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug, status: 'active' } }));
  }

  // --- Attributes ---
  const sizeAttr = await prisma.attribute.create({
    data: { name: 'Size', type: 'dropdown', isFilterable: true, values: { create: ['S', 'M', 'L', 'XL'].map((v, i) => ({ value: v, displayOrder: i })) } },
  });
  const colorAttr = await prisma.attribute.create({
    data: {
      name: 'Color',
      type: 'color',
      isFilterable: true,
      values: {
        create: [
          { value: 'Black', colorHex: '#111111' },
          { value: 'White', colorHex: '#F5F5F5' },
          { value: 'Blue', colorHex: '#149BFF' },
        ],
      },
    },
  });

  // --- Sellers ---
  const shopNames = ['Urban Nest Co.', 'Silverline Traders', 'Pixel & Palm', 'Coastal Goods', 'Ember & Oak', 'Bright Basket Mart', 'Northfield Supply', 'Velvet Row', 'Cedar & Stone', 'Aurora Mercantile', 'The Corner Depot', 'Glow Studio Shop'];
  const sellers = [];
  for (let i = 0; i < shopNames.length; i++) {
    const name = faker.person.fullName();
    const status: SellerStatus = i < 8 ? 'APPROVED' : i < 11 ? 'PENDING' : 'REJECTED';
    sellers.push(
      await prisma.seller.create({
        data: {
          name,
          shopName: shopNames[i],
          email: faker.internet.email({ firstName: shopNames[i].replace(/\W+/g, '') }).toLowerCase(),
          status,
          rating: faker.number.float({ min: 3.6, max: 5, fractionDigits: 1 }),
          verifiedAt: status === 'APPROVED' ? faker.date.past({ years: 1 }) : null,
        },
      }),
    );
  }

  // --- Warehouses ---
  const warehouseDefs = [
    { name: 'Central Distribution Hub', code: 'WH-CTRL', city: 'Dallas', country: 'US' },
    { name: 'West Coast Fulfillment', code: 'WH-WEST', city: 'Reno', country: 'US' },
    { name: 'European Hub', code: 'WH-EU', city: 'Rotterdam', country: 'NL' },
  ];
  const warehouses = [];
  for (const w of warehouseDefs) {
    warehouses.push(await prisma.warehouse.upsert({ where: { code: w.code }, update: {}, create: { ...w, storeId: store.id, isActive: true } }));
  }

  // --- Products ---
  const productNames = [
    'Wireless Noise-Cancel Headphones', 'Aroma Diffuser Deluxe', 'Trail Running Shoes', 'Ceramic Pour-Over Set',
    'Smart Fitness Band', 'Linen Weekend Bag', 'Minimalist Desk Lamp', 'Organic Face Serum',
    'Bamboo Cutting Board Set', 'Portable Bluetooth Speaker', 'Cotton Knit Throw Blanket', 'Stainless Water Bottle',
    'Kids Building Blocks Set', 'Leather Card Wallet', 'Yoga Mat Pro', 'Wireless Charging Stand',
    'Ceramic Plant Pot Trio', 'Graphic Novel Box Set', 'Non-stick Cookware Set', 'Adjustable Standing Desk',
    'Retro Film Camera', 'Merino Wool Beanie', 'Electric Kettle 1.7L', 'Kids Rain Jacket',
    'Scented Soy Candle Trio', 'Compact Air Fryer', 'Canvas Backpack', 'Sunglasses Polarized',
    'Board Game Night Bundle', 'Skincare Gift Set',
  ];

  const products = [];
  for (let i = 0; i < productNames.length; i++) {
    const name = productNames[i];
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + i;
    const category = categories[i % categories.length];
    const brand = brands[i % brands.length];
    const useSeller = i % 3 !== 0;
    const seller = useSeller ? sellers[i % sellers.length] : null;
    const price = faker.number.int({ min: 12, max: 480 });
    const stock = faker.number.int({ min: 0, max: 400 });
    const status: ProductStatus = stock === 0 ? 'OUT_OF_STOCK' : 'PUBLISHED';

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku: `SKU-${(1000 + i).toString(36).toUpperCase()}`,
        type: 'SIMPLE' as ProductType,
        status,
        shortDescription: faker.commerce.productDescription().slice(0, 120),
        categoryId: category.id,
        brandId: brand.id,
        sellerId: seller?.id,
        regularPrice: price,
        salePrice: Math.random() > 0.7 ? Math.round(price * 0.85) : null,
        costPrice: Math.round(price * 0.55),
        stock,
        reorderLevel: 15,
        rating: faker.number.float({ min: 3.2, max: 5, fractionDigits: 1 }),
        images: { create: [{ url: `https://picsum.photos/seed/${slug}/480/480`, displayOrder: 0 }] },
      },
    });
    products.push(product);

    await prisma.stockItem.create({
      data: { productId: product.id, warehouseId: warehouses[i % warehouses.length].id, quantity: stock, reserved: Math.min(stock, faker.number.int({ min: 0, max: 5 })) },
    });
  }

  // --- Customers ---
  const customers = [];
  for (let i = 0; i < 40; i++) {
    const name = faker.person.fullName();
    const customer = await prisma.customer.create({
      data: {
        name,
        email: faker.internet.email({ firstName: name.split(' ')[0] + i }).toLowerCase(),
        phone: faker.phone.number(),
        preferredLanguage: 'en',
        preferredCurrency: 'USD',
        loyaltyPoints: faker.number.int({ min: 0, max: 4200 }),
        storeCredit: faker.number.int({ min: 0, max: 150 }),
        addresses: {
          create: [
            {
              label: 'home',
              line1: faker.location.streetAddress(),
              city: faker.location.city(),
              country: faker.location.country(),
              isDefault: true,
            },
          ],
        },
      },
    });
    customers.push(customer);
  }

  // --- Orders ---
  const orderStatuses: OrderStatus[] = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
  ];
  for (let i = 0; i < 120; i++) {
    const customer = customers[i % customers.length];
    const useSeller = i % 2 === 0;
    const seller = useSeller ? sellers[i % sellers.length] : null;
    const status = orderStatuses[i % orderStatuses.length];
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const orderProducts = Array.from({ length: itemCount }, () => products[faker.number.int({ min: 0, max: products.length - 1 })]);
    const subtotal = orderProducts.reduce((sum, p) => sum + Number(p.regularPrice), 0);
    const shippingTotal = faker.number.int({ min: 0, max: 15 });
    const taxTotal = Math.round(subtotal * 0.08);
    const total = subtotal + shippingTotal + taxTotal;

    const order = await prisma.order.create({
      data: {
        orderNumber: `VG-${(20450 + i).toString()}`,
        storeId: store.id,
        customerId: customer.id,
        sellerId: seller?.id,
        channel: (seller ? 'SELLER' : 'IN_HOUSE') as OrderChannel,
        source: 'WEBSITE' as OrderSource,
        status,
        subtotal,
        shippingTotal,
        taxTotal,
        total,
        items: {
          create: orderProducts.map((p) => ({
            productId: p.id,
            name: p.name,
            sku: p.sku,
            quantity: 1,
            unitPrice: p.regularPrice,
            total: p.regularPrice,
          })),
        },
        payments: {
          create: [
            {
              method: pick(['card', 'wallet', 'cash_on_delivery', 'bank_transfer']),
              amount: total,
              status: (status === 'CANCELLED' ? 'FAILED' : status === 'REFUNDED' ? 'REFUNDED' : 'PAID') as PaymentStatus,
              paidAt: status === 'PENDING' ? null : faker.date.recent({ days: 30 }),
            },
          ],
        },
      },
    });

    if (status === 'REFUNDED') {
      await prisma.refund.create({
        data: { orderId: order.id, amount: total, reason: pick(['Item damaged in transit', 'Wrong item delivered', 'Changed my mind']), status: 'APPROVED' },
      });
    }
  }

  // --- Coupons ---
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, usedCount: 842 },
      { code: 'FREESHIP', discountType: 'FIXED', discountValue: 8, usedCount: 611 },
      { code: 'FLASH25', discountType: 'PERCENTAGE', discountValue: 25, usedCount: 398 },
      { code: 'SAVE20', discountType: 'PERCENTAGE', discountValue: 20, usedCount: 276 },
    ],
    skipDuplicates: true,
  });

  // --- Delivery agents ---
  const agentNames = ['Malik Rowe', 'Priya Nandan', 'Theo Vance', 'Ines Farah', 'Jonah Kade', 'Layla Moreno'];
  for (const name of agentNames) {
    const email = faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase();
    await prisma.deliveryAgent.upsert({
      where: { email },
      update: {},
      create: { name, email, status: pick(['online', 'busy', 'offline']), rating: faker.number.float({ min: 4.0, max: 5, fractionDigits: 1 }) },
    });
  }

  // --- Support tickets ---
  const subjects = ['Order not delivered yet', 'Refund status inquiry', 'Unable to apply coupon code', 'Product arrived damaged', 'Payment charged twice', 'Seller not responding'];
  for (let i = 0; i < subjects.length; i++) {
    await prisma.supportTicket.create({
      data: {
        subject: subjects[i],
        customerId: customers[i % customers.length].id,
        priority: pick(['LOW', 'MEDIUM', 'HIGH']) as TicketPriority,
        status: pick(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) as TicketStatus,
      },
    });
  }

  // --- Notifications ---
  await prisma.notification.createMany({
    data: [
      { title: 'New order received', body: 'A new order was placed', channel: 'IN_APP', status: 'UNREAD', recipientType: 'staff' },
      { title: 'Seller verification requested', body: 'Coastal Goods submitted documents for review', channel: 'IN_APP', status: 'UNREAD', recipientType: 'staff' },
      { title: 'Refund request', body: 'A refund needs approval', channel: 'IN_APP', status: 'UNREAD', recipientType: 'staff' },
      { title: 'Low stock alert', body: 'Trail Running Shoes — only 6 left', channel: 'IN_APP', status: 'READ', recipientType: 'staff' },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
