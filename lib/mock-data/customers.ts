import type { Customer } from "@/types";

export const customers: Customer[] = [
  {
    id: "cust-1",
    name: "Layla Alharbi",
    email: "layla.alharbi@example.com",
    avatar: "LA",
    joinedAt: "2026-07-12T10:00:00.000Z",
    totalOrders: 3,
    totalSpent: 150,
    location: "Riyadh, Saudi Arabia",
  },
  {
    id: "cust-2",
    name: "Omar Nasser",
    email: "omar.nasser@example.com",
    avatar: "ON",
    joinedAt: "2026-07-08T10:00:00.000Z",
    totalOrders: 2,
    totalSpent: 80,
    location: "Jeddah, Saudi Arabia",
  },
  {
    id: "cust-3",
    name: "Hana Saleh",
    email: "hana.saleh@example.com",
    avatar: "HS",
    joinedAt: "2026-06-28T10:00:00.000Z",
    totalOrders: 1,
    totalSpent: 42,
    location: "Madinah, Saudi Arabia",
  },
  {
    id: "cust-4",
    name: "Amelia Foster",
    email: "amelia.foster@example.com",
    avatar: "AF",
    joinedAt: "2026-06-20T10:00:00.000Z",
    totalOrders: 4,
    totalSpent: 210,
    location: "Riyadh, Saudi Arabia",
  },
];

export const recentCustomers = [...customers]
  .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
  .slice(0, 8);

export const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
