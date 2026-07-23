import type { Notification, Coupon } from "@/types";

export const notifications: Notification[] = [
  { id: "n1", title: "New order received", description: "#VG-20558 placed by Alina Cho for $214.00", time: "2m ago", read: false, type: "order" },
  { id: "n2", title: "Seller verification requested", description: "Coastal Goods submitted documents for review", time: "18m ago", read: false, type: "seller" },
  { id: "n3", title: "Refund request", description: "RF-3407 needs approval — $86.00", time: "42m ago", read: false, type: "refund" },
  { id: "n4", title: "New customer registered", description: "Devon Marsh created an account", time: "1h ago", read: true, type: "customer" },
  { id: "n5", title: "Low stock alert", description: "Trail Running Shoes — only 6 left", time: "3h ago", read: true, type: "system" },
  { id: "n6", title: "Order delivered", description: "#VG-20501 marked as delivered", time: "5h ago", read: true, type: "order" },
];

export const unreadNotificationCount = notifications.filter((n) => !n.read).length;

export const coupons: Coupon[] = [
  { id: "cp-1", code: "WELCOME10", uses: 842, discountType: "percent", discountValue: 10, revenue: 24800 },
  { id: "cp-2", code: "FREESHIP", uses: 611, discountType: "fixed", discountValue: 8, revenue: 18200 },
  { id: "cp-3", code: "FLASH25", uses: 398, discountType: "percent", discountValue: 25, revenue: 31400 },
  { id: "cp-4", code: "SAVE20", uses: 276, discountType: "percent", discountValue: 20, revenue: 15600 },
];

export const paymentMethods = [
  { name: "Card", value: 48, color: "var(--chart-1)" },
  { name: "Wallet", value: 24, color: "var(--chart-2)" },
  { name: "Cash on Delivery", value: 20, color: "var(--chart-3)" },
  { name: "Bank Transfer", value: 8, color: "var(--chart-4)" },
];

export const trafficSources = [
  { name: "Organic Search", value: 38, color: "var(--chart-1)" },
  { name: "Direct", value: 26, color: "var(--chart-2)" },
  { name: "Social", value: 20, color: "var(--chart-3)" },
  { name: "Referral", value: 16, color: "var(--chart-4)" },
];

export const salesByCountry = [
  { name: "United States", value: 186400 },
  { name: "United Kingdom", value: 94200 },
  { name: "Germany", value: 71800 },
  { name: "UAE", value: 63500 },
  { name: "Canada", value: 48900 },
];

export const salesByDevice = [
  { name: "Mobile", value: 61, color: "var(--chart-1)" },
  { name: "Desktop", value: 31, color: "var(--chart-2)" },
  { name: "Tablet", value: 8, color: "var(--chart-3)" },
];

export const recentActivity = [
  { id: "a1", actor: "Sarah Kim", action: "approved seller", target: "Coastal Goods", time: "12m ago" },
  { id: "a2", actor: "System", action: "flagged low stock for", target: "Trail Running Shoes", time: "1h ago" },
  { id: "a3", actor: "Marcus Lee", action: "issued refund for", target: "#VG-20488", time: "2h ago" },
  { id: "a4", actor: "System", action: "generated invoice for", target: "#VG-20501", time: "4h ago" },
  { id: "a5", actor: "Sarah Kim", action: "published coupon", target: "FLASH25", time: "6h ago" },
];
