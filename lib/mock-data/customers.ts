import { faker } from "@faker-js/faker";
import type { Customer } from "@/types";

faker.seed(202);

export const customers: Customer[] = Array.from({ length: 40 }).map((_, i) => {
  const name = faker.person.fullName();
  return {
    id: `cust-${i + 1}`,
    name,
    email: faker.internet.email({ firstName: name.split(" ")[0] }).toLowerCase(),
    avatar: name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join(""),
    joinedAt: faker.date.recent({ days: 120 }).toISOString(),
    totalOrders: faker.number.int({ min: 1, max: 48 }),
    totalSpent: faker.number.int({ min: 40, max: 9200 }),
    location: faker.location.city() + ", " + faker.location.country(),
  };
});

export const recentCustomers = [...customers]
  .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
  .slice(0, 8);

export const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
