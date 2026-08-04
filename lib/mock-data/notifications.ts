import type { Notification, Coupon } from "@/types";

export const notifications: Notification[] = [
  { id: "n1", title: "New order received", description: "#HAL-10020 — Zesty Crunch + Citrus Kick", time: "2m ago", read: false, type: "order" },
  { id: "n2", title: "Low stock alert", description: "Tahini Twist — only 12 jars left", time: "18m ago", read: false, type: "system" },
  { id: "n3", title: "Gift set popular", description: "The Halopeno Set sold 6 times this week", time: "1h ago", read: false, type: "order" },
  { id: "n4", title: "New customer registered", description: "Layla Alharbi created an account", time: "3h ago", read: true, type: "customer" },
  { id: "n5", title: "Coupon used", description: "FIRSTKICK applied on #HAL-10022", time: "5h ago", read: true, type: "order" },
];

export const unreadNotificationCount = notifications.filter((n) => !n.read).length;

export const coupons: Coupon[] = [
  { id: "cp-1", code: "TRYALL20", uses: 48, discountType: "percent", discountValue: 20, revenue: 3200 },
  { id: "cp-2", code: "FIRSTKICK", uses: 112, discountType: "fixed", discountValue: 10, revenue: 4100 },
  { id: "cp-3", code: "GIFTSET15", uses: 22, discountType: "percent", discountValue: 15, revenue: 1800 },
  { id: "cp-4", code: "MONTHLYKICK", uses: 57, discountType: "percent", discountValue: 10, revenue: 2400 },
];

export const paymentMethods = [
  { name: "Card", value: 54, color: "var(--chart-1)" },
  { name: "Apple Pay", value: 28, color: "var(--chart-2)" },
  { name: "Cash on Delivery", value: 18, color: "var(--chart-3)" },
];

export const trafficSources = [
  { name: "Instagram", value: 42, color: "var(--chart-1)" },
  { name: "Direct", value: 28, color: "var(--chart-2)" },
  { name: "Organic Search", value: 18, color: "var(--chart-3)" },
  { name: "Referral", value: 12, color: "var(--chart-4)" },
];

export const salesByCountry = [
  { name: "Saudi Arabia", value: 18600 },
  { name: "UAE", value: 3200 },
  { name: "Kuwait", value: 1640 },
];

export const salesByDevice = [
  { name: "Mobile", value: 72, color: "var(--chart-1)" },
  { name: "Desktop", value: 22, color: "var(--chart-2)" },
  { name: "Tablet", value: 6, color: "var(--chart-3)" },
];

export const recentActivity = [
  { id: "a1", actor: "System", action: "flagged low stock for", target: "Tahini Twist", time: "12m ago" },
  { id: "a2", actor: "Halopeno Admin", action: "published coupon", target: "TRYALL20", time: "1h ago" },
  { id: "a3", actor: "System", action: "received order", target: "#HAL-10020", time: "2h ago" },
  { id: "a4", actor: "Halopeno Admin", action: "updated product", target: "Ruby Heat", time: "4h ago" },
];
