export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus = "paid" | "unpaid" | "partial" | "refunded";
export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "failed";
export type SellerStatus = "approved" | "pending" | "rejected";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type ProductStatus = "active" | "draft" | "out_of_stock" | "inactive";

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  color: string;
  productCount: number;
  revenue: number;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  productCount: number;
  revenue: number;
}

export interface Seller {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  status: SellerStatus;
  productCount: number;
  totalSales: number;
  rating: number;
  joinedAt: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  sku: string;
  sellerId: string | null;
  sellerName: string;
  categoryId: string;
  categoryName: string;
  brandName: string;
  qtySold: number;
  stock: number;
  price: number;
  revenue: number;
  status: ProductStatus;
  rating: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  sellerName: string;
  channel: "in_house" | "seller";
  date: string;
  productCount: number;
  total: number;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  status: OrderStatus;
}

export interface Refund {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  reason: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export interface SupportTicket {
  id: string;
  subject: string;
  customerName: string;
  avatar: string;
  priority: "low" | "medium" | "high";
  status: TicketStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "order" | "seller" | "customer" | "system" | "refund";
}

export interface DeliveryAgent {
  id: string;
  name: string;
  avatar: string;
  activeDeliveries: number;
  completedDeliveries: number;
  rating: number;
  status: "online" | "offline" | "busy";
}

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
  inHouseSales: number;
  sellerSales: number;
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
}

export interface Coupon {
  id: string;
  code: string;
  uses: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  revenue: number;
}
