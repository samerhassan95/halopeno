import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const campaigns = [
  {
    name: 'Ramadan Flavor Festival',
    type: 'seasonal',
    channels: ['email', 'push', 'social'],
    segment: 'All customers',
    goal: 'Drive repeat purchases during Ramadan',
    status: 'active',
    budget: 8000,
    spend: 5230,
    revenue: 24800,
    startsAt: new Date(now - 5 * day),
    endsAt: new Date(now + 10 * day),
  },
  {
    name: 'New Customer Welcome Series',
    type: 'retention',
    channels: ['email'],
    segment: 'New customers',
    goal: 'Increase first-order-to-second-order conversion',
    status: 'active',
    budget: 1500,
    spend: 940,
    revenue: 6100,
    startsAt: new Date(now - 30 * day),
    endsAt: new Date(now + 60 * day),
  },
  {
    name: 'Vine Fire Launch',
    type: 'product_launch',
    channels: ['email', 'push', 'social', 'sms'],
    segment: 'Spice lovers',
    goal: 'Launch awareness for Vine Fire jar',
    status: 'completed',
    budget: 4000,
    spend: 3980,
    revenue: 15200,
    startsAt: new Date(now - 40 * day),
    endsAt: new Date(now - 20 * day),
  },
  {
    name: 'Abandoned Cart Win-back',
    type: 'retention',
    channels: ['email', 'push'],
    segment: 'Abandoned cart',
    goal: 'Recover lost carts',
    status: 'active',
    budget: 900,
    spend: 410,
    revenue: 3200,
    startsAt: new Date(now - 15 * day),
    endsAt: new Date(now + 45 * day),
  },
  {
    name: 'Black Friday Mega Sale',
    type: 'seasonal',
    channels: ['email', 'push', 'social', 'sms'],
    segment: 'All customers',
    goal: 'Maximize Q4 revenue',
    status: 'scheduled',
    budget: 12000,
    spend: 0,
    revenue: 0,
    startsAt: new Date(now + 20 * day),
    endsAt: new Date(now + 27 * day),
  },
  {
    name: 'Wholesale B2B Outreach',
    type: 'acquisition',
    channels: ['email'],
    segment: 'B2B leads',
    goal: 'Sign new wholesale accounts',
    status: 'draft',
    budget: 2000,
    spend: 0,
    revenue: 0,
    startsAt: null,
    endsAt: null,
  },
];

async function main() {
  for (const c of campaigns) {
    await prisma.campaign.create({ data: c });
  }
  console.log(`Seeded ${campaigns.length} campaigns.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
