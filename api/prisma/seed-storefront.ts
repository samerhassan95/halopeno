import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

const img = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const categories = [
  { name: 'Biryani', slug: 'biryani', image: img('1599487488170-d11ec9c172f0', 300) },
  { name: 'Rice Meals', slug: 'rice-meals', image: img('1585032226651-759b368d7246', 300) },
  { name: 'Chicken', slug: 'chicken', image: img('1601924582970-9238bcb495d9', 300) },
  { name: 'Grills', slug: 'grills', image: img('1596797038530-2c107229654b', 300) },
  { name: 'Curries', slug: 'curries', image: img('1631515243349-e0cb75fb8d3a', 300) },
  { name: 'Paneer', slug: 'paneer', image: img('1546833999-b9f581a1996d', 300) },
  { name: 'Vegetarian', slug: 'vegetarian', image: img('1512058564366-18510be2db19', 300) },
  { name: 'Appetizers', slug: 'appetizers', image: img('1601050690597-df0568f70950', 300) },
  { name: 'Bread', slug: 'bread', image: img('1567620905732-2d1ec7ab7445', 300) },
  { name: 'Desserts', slug: 'desserts', image: img('1587314168485-3236d6710814', 300) },
  { name: 'Drinks', slug: 'drinks', image: img('1544145945-f90425340c7e', 300) },
];

const products = [
  { slug: 'chicken-dum-biryani', name: 'Chicken Dum Biryani', category: 'biryani', price: 14.9, oldPrice: 18.5, stock: 120, rating: 4.8, reviewCount: 342, sku: 'SC-BIR-001', desc: 'Slow-cooked basmati rice layered with marinated chicken and warm spices.', image: img('1599487488170-d11ec9c172f0') },
  { slug: 'mutton-biryani', name: 'Mutton Biryani', category: 'biryani', price: 17.9, stock: 60, rating: 4.9, reviewCount: 218, sku: 'SC-BIR-002', desc: 'Tender mutton pieces slow-cooked with fragrant basmati and royal spices.', image: img('1631452180519-c014fe946bc7') },
  { slug: 'paneer-tikka-biryani', name: 'Paneer Tikka Biryani', category: 'biryani', price: 13.5, stock: 80, rating: 4.6, reviewCount: 156, sku: 'SC-BIR-003', desc: "Char-grilled paneer tikka folded into saffron basmati rice.", image: img('1546833999-b9f581a1996d') },
  { slug: 'hyderabadi-biryani', name: 'Hyderabadi Biryani', category: 'biryani', price: 15.9, stock: 90, rating: 4.7, reviewCount: 289, sku: 'SC-BIR-004', desc: 'The original dum-style biryani with a bold, aromatic spice blend.', image: img('1563379091339-03b21ab4a4f8') },
  { slug: 'butter-chicken', name: 'Butter Chicken', category: 'curries', price: 15.5, stock: 140, rating: 4.9, reviewCount: 410, sku: 'SC-CUR-001', desc: 'Char-grilled chicken simmered in a velvety tomato and butter gravy.', image: img('1567188040759-fb8a883dc6d8') },
  { slug: 'tandoori-chicken', name: 'Tandoori Chicken', category: 'grills', price: 13.9, stock: 70, rating: 4.7, reviewCount: 198, sku: 'SC-GRL-001', desc: 'Charcoal tandoor-roasted chicken marinated in yogurt and spices.', image: img('1601924582970-9238bcb495d9') },
  { slug: 'chicken-tikka-masala', name: 'Chicken Tikka Masala', category: 'curries', price: 14.5, stock: 100, rating: 4.6, reviewCount: 267, sku: 'SC-CUR-002', desc: 'Grilled chicken tikka in a smoky, spiced onion-tomato masala.', image: img('1631515243349-e0cb75fb8d3a') },
  { slug: 'paneer-butter-masala', name: 'Paneer Butter Masala', category: 'paneer', price: 12.9, stock: 90, rating: 4.7, reviewCount: 231, sku: 'SC-PAN-001', desc: 'Soft paneer cubes in a rich, creamy tomato-butter sauce.', image: img('1546069901-ba9599a7e63c') },
  { slug: 'dal-makhani', name: 'Dal Makhani', category: 'vegetarian', price: 10.9, stock: 100, rating: 4.5, reviewCount: 142, sku: 'SC-VEG-001', desc: 'Black lentils slow-simmered overnight with butter and cream.', image: img('1631515243349-e0cb75fb8d3a') },
  { slug: 'garlic-naan', name: 'Garlic Naan', category: 'bread', price: 3.5, stock: 300, rating: 4.8, reviewCount: 312, sku: 'SC-BRD-001', desc: 'Fluffy tandoor-baked flatbread brushed with garlic butter.', image: img('1601050690597-df0568f70950') },
  { slug: 'chicken-65', name: 'Chicken 65', category: 'appetizers', price: 9.5, stock: 110, rating: 4.6, reviewCount: 178, sku: 'SC-APP-001', desc: 'Crispy deep-fried chicken tossed in curry leaves and chilli.', image: img('1596797038530-2c107229654b') },
  { slug: 'paneer-tikka', name: 'Paneer Tikka', category: 'appetizers', price: 8.9, stock: 90, rating: 4.5, reviewCount: 134, sku: 'SC-APP-002', desc: 'Char-grilled paneer and peppers marinated in tandoori spices.', image: img('1615870216519-2f9fa575fa5c') },
  { slug: 'gulab-jamun', name: 'Gulab Jamun', category: 'desserts', price: 5.9, stock: 200, rating: 4.9, reviewCount: 267, sku: 'SC-DES-001', desc: 'Warm milk-solid dumplings soaked in cardamom rose syrup.', image: img('1587314168485-3236d6710814') },
  { slug: 'mango-lassi', name: 'Mango Lassi', category: 'drinks', price: 4.5, stock: 250, rating: 4.8, reviewCount: 198, sku: 'SC-DRK-001', desc: 'Chilled yogurt smoothie blended with sweet Alphonso mango.', image: img('1544145945-f90425340c7e') },
  { slug: 'vegetable-biryani', name: 'Vegetable Biryani', category: 'rice-meals', price: 11.9, stock: 100, rating: 4.4, reviewCount: 121, sku: 'SC-RIC-001', desc: 'Garden vegetables and basmati rice layered with warm spices.', image: img('1585032226651-759b368d7246') },
  { slug: 'chicken-seekh-kebab', name: 'Chicken Seekh Kebab', category: 'grills', price: 11.5, stock: 80, rating: 4.6, reviewCount: 156, sku: 'SC-GRL-002', desc: 'Minced chicken skewers grilled over charcoal with fresh herbs.', image: img('1596797038530-2c107229654b') },
  { slug: 'saag-paneer', name: 'Saag Paneer', category: 'paneer', price: 11.5, stock: 70, rating: 4.5, reviewCount: 109, sku: 'SC-PAN-002', desc: 'Paneer cubes simmered in a silky, spiced spinach purée.', image: img('1546833999-b9f581a1996d') },
];

const sizeVariants = [
  { label: 'Regular', delta: 0 },
  { label: 'Large', delta: 4 },
  { label: 'Family', delta: 9 },
];

async function main() {
  console.log('Seeding storefront catalog...');

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, image: c.image, status: 'active' },
      create: { name: c.name, slug: c.slug, image: c.image, status: 'active', isFeatured: true },
    });
    categoryIds[c.slug] = row.id;
  }

  const customers = await prisma.customer.findMany({ take: 10 });

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        categoryId: categoryIds[p.category],
        shortDescription: p.desc,
        description: p.desc,
        regularPrice: p.price,
        salePrice: p.oldPrice ?? null,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
      },
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId: categoryIds[p.category],
        shortDescription: p.desc,
        description: p.desc,
        regularPrice: p.price,
        salePrice: p.oldPrice ?? null,
        stock: p.stock,
        reorderLevel: 15,
        rating: p.rating,
        reviewCount: p.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
      },
    });

    const existingImages = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!existingImages) {
      await prisma.productImage.create({ data: { productId: product.id, url: p.image, displayOrder: 0 } });
    }

    const existingVariants = await prisma.productVariant.findFirst({ where: { productId: product.id } });
    if (!existingVariants) {
      for (const v of sizeVariants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${p.sku}-${v.label.toUpperCase()}`,
            optionsJson: { size: v.label },
            price: p.price + v.delta,
            stock: Math.round(p.stock / 3),
            status: 'active',
          },
        });
      }
    }

    if (customers.length) {
      const existingReview = await prisma.review.findFirst({ where: { productId: product.id } });
      if (!existingReview) {
        const reviewer = customers[Math.floor(Math.random() * customers.length)];
        await prisma.review.create({
          data: {
            productId: product.id,
            customerId: reviewer.id,
            rating: Math.round(p.rating),
            title: 'Delicious and fresh',
            body: `The ${p.name} was cooked perfectly and arrived hot. Will order again!`,
            isVerified: true,
            status: 'APPROVED',
            helpfulCount: Math.floor(Math.random() * 30),
          },
        });
      }
    }
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
