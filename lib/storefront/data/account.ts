import type { Address, PastOrder } from "@/types/storefront";

export const mockAddresses: Address[] = [
  { id: "a1", label: "Home", line1: "42 Cedar Lane, Springfield", city: "Springfield", isDefault: true },
  { id: "a2", label: "Work", line1: "108 Market Street, Springfield", city: "Springfield" },
];

export const mockPastOrders: PastOrder[] = [
  { id: "SC48213", date: "2026-07-18", items: "Chicken Dum Biryani, Garlic Naan", total: 21.4, status: "delivered", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=200&q=60" },
  { id: "SC48012", date: "2026-07-02", items: "Butter Chicken, Rice, Mango Lassi", total: 24.9, status: "delivered", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=200&q=60" },
  { id: "SC47650", date: "2026-06-20", items: "Paneer Tikka Biryani", total: 13.5, status: "cancelled", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=60" },
];

export const mockPaymentMethods = [
  { id: "pm1", label: "Visa •••• 4242", isDefault: true },
  { id: "pm2", label: "Mastercard •••• 8891" },
];

export const mockCoupons = [
  { id: "c1", code: "WELCOME10", desc: "10% off your next order", expires: "Aug 31, 2026" },
  { id: "c2", code: "FREESHIP25", desc: "Free delivery over $25", expires: "Dec 31, 2026" },
];

export const mockNotifications = [
  { id: "n1", title: "Your order is out for delivery", time: "2h ago" },
  { id: "n2", title: "New Weekend Biryani Special is live", time: "1d ago" },
  { id: "n3", title: "You earned 45 Spice Rewards points", time: "3d ago" },
];

export const mockSupportTickets = [
  { id: "t1", subject: "Missing item from order #SC47650", status: "resolved" },
  { id: "t2", subject: "Question about allergens", status: "open" },
];
