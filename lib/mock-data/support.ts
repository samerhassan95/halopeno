import { faker } from "@faker-js/faker";
import type { SupportTicket, DeliveryAgent } from "@/types";
import { customers } from "./customers";

faker.seed(606);

const subjects = [
  "Order not delivered yet",
  "Refund status inquiry",
  "Unable to apply coupon code",
  "Product arrived damaged",
  "Payment charged twice",
  "Seller not responding",
  "Wrong size received",
  "Account login issue",
];

export const supportTickets: SupportTicket[] = subjects.map((subject, i) => {
  const customer = customers[(i * 4) % customers.length];
  return {
    id: `TCK-${(9100 + i).toString()}`,
    subject,
    customerName: customer.name,
    avatar: customer.avatar,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
    status: i % 4 === 0 ? "resolved" : i % 4 === 1 ? "in_progress" : i % 4 === 2 ? "open" : "closed",
    createdAt: faker.date.recent({ days: 10 }).toISOString(),
  };
});

export const recentTickets = supportTickets.slice(0, 6);

const agentNames = ["Malik Rowe", "Priya Nandan", "Theo Vance", "Ines Farah", "Jonah Kade", "Layla Moreno"];

export const deliveryAgents: DeliveryAgent[] = agentNames.map((name, i) => ({
  id: `agent-${i + 1}`,
  name,
  avatar: name.split(" ").map((p) => p[0]).join(""),
  activeDeliveries: faker.number.int({ min: 0, max: 12 }),
  completedDeliveries: faker.number.int({ min: 40, max: 620 }),
  rating: Number(faker.number.float({ min: 4.0, max: 5, fractionDigits: 1 }).toFixed(1)),
  status: i % 3 === 0 ? "online" : i % 3 === 1 ? "busy" : "offline",
}));
