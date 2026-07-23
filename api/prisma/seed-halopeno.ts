import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
];

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'flavors' },
      update: { name: 'Pickled Flavors', status: 'active', isFeatured: true },
      create: { name: 'Pickled Flavors', slug: 'flavors', status: 'active', isFeatured: true, displayOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'sets' },
      update: { name: 'Gift Sets', status: 'active', isFeatured: true },
      create: { name: 'Gift Sets', slug: 'sets', status: 'active', isFeatured: true, displayOrder: 2 },
    }),
  ]);
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  for (const item of catalog) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sku: item.sku,
        categoryId: categoryBySlug.get(item.category),
        shortDescription: item.description,
        description: item.description,
        regularPrice: item.price,
        stock: item.stock,
        rating: item.rating,
        reviewCount: item.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
      },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        categoryId: categoryBySlug.get(item.category),
        shortDescription: item.description,
        description: item.description,
        regularPrice: item.price,
        stock: item.stock,
        reorderLevel: 15,
        rating: item.rating,
        reviewCount: item.reviewCount,
        status: 'PUBLISHED' as ProductStatus,
      },
    });

    const image = await prisma.productImage.findFirst({
      where: { productId: product.id, displayOrder: 0 },
    });
    if (image) {
      await prisma.productImage.update({ where: { id: image.id }, data: { url: item.image, altText: item.name } });
    } else {
      await prisma.productImage.create({
        data: { productId: product.id, url: item.image, altText: item.name, displayOrder: 0 },
      });
    }
  }

  console.log(`Seeded ${catalog.length} Halopeno products for the storefront and admin.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
