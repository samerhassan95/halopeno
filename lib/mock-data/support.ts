import type { SupportTicket, DeliveryAgent } from "@/types";
import { customers } from "./customers";

const subjects = [
  "Order not delivered yet",
  "Jar arrived cracked",
  "Unable to apply FIRSTKICK",
  "Question about mustard allergen",
  "Wholesale inquiry for restaurants",
  "Wrong flavor in The Halopeno Set",
];

export const supportTickets: SupportTicket[] = subjects.map((subject, i) => {
  const customer = customers[i % customers.length];
  return {
    id: `TCK-${(9100 + i).toString()}`,
    subject,
    customerName: customer.name,
    avatar: customer.avatar,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
    status: i % 4 === 0 ? "resolved" : i % 4 === 1 ? "in_progress" : i % 4 === 2 ? "open" : "closed",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

export const recentTickets = supportTickets.slice(0, 6);

export const deliveryAgents: DeliveryAgent[] = [
  {
    id: "agent-1",
    name: "Riyadh Express",
    avatar: "RE",
    activeDeliveries: 3,
    completedDeliveries: 128,
    rating: 4.8,
    status: "online",
  },
];
