import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Gavel,
  Boxes,
  FolderTree,
  Tag,
  SlidersHorizontal,
  Palette,
  Percent,
  Warehouse,
  ShoppingCart,
  ScanLine,
  Undo2,
  CalendarClock,
  ShoppingBag,
  Receipt,
  FileText,
  Users,
  Store,
  Truck,
  ShieldCheck,
  UsersRound,
  Megaphone,
  TicketPercent,
  Zap,
  LineChart,
  BarChart3,
  Handshake,
  Award,
  Mail,
  BellRing,
  BarChart2,
  PieChart,
  ClipboardList,
  Landmark,
  Percent as PercentIcon,
  Wallet,
  LayoutTemplate,
  Home,
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  Images,
  FileStack,
  Newspaper,
  Headset,
  MessageSquareText,
  Bell,
  MessagesSquare,
  CreditCard,
  PackageSearch,
  KeyRound,
  Plug,
  Webhook,
  Settings2,
  UserCog,
  Lock,
  Cog,
  Coins,
  Languages,
  PuzzleIcon,
  DatabaseBackup,
  History,
  Layers,
  ArrowRightLeft,
  ClipboardCheck,
  PackagePlus,
  HandCoins,
  Banknote,
  Calculator,
  MapPin,
  Route,
  Building2,
  ListTree,
  MessageCircleWarning,
  BookOpenText,
  Rocket,
  Users2,
  CalendarRange,
  PanelTop,
  PanelBottom,
  SwatchBook,
  Wand2,
  FileSliders,
} from "lucide-react";

export interface NavLabel {
  en: string;
  ar: string;
}

export interface NavLeaf {
  type: "leaf";
  label: NavLabel;
  href: string;
  icon?: LucideIcon;
  badge?: number;
}

export interface NavGroup {
  type: "group";
  label: NavLabel;
  icon?: LucideIcon;
  children: NavLeaf[];
}

export type NavItem = NavLeaf | NavGroup;

export interface NavSection {
  label: NavLabel | null;
  items: NavItem[];
}

function leaf(en: string, ar: string, href: string, icon?: LucideIcon, badge?: number): NavLeaf {
  return { type: "leaf", label: { en, ar }, href, icon, badge };
}

function group(en: string, ar: string, icon: LucideIcon, children: NavLeaf[]): NavGroup {
  return { type: "group", label: { en, ar }, icon, children };
}

export const navSections: NavSection[] = [
  {
    label: null,
    items: [leaf("Dashboard", "الرئيسية", "/admin", LayoutDashboard)],
  },
  {
    label: { en: "Products", ar: "المنتجات" },
    items: [
      group("Product Management", "إدارة المنتجات", Package, [
        leaf("All Products", "كل المنتجات", "/admin/products/all"),
        leaf("Add New Product", "إضافة منتج جديد", "/admin/products/all/new"),
        leaf("Product Reviews", "تقييمات المنتجات", "/admin/products/reviews"),
        leaf("Product Queries", "استفسارات المنتجات", "/admin/products/queries"),
      ]),
      leaf("Auction Products", "منتجات المزاد", "/admin/products/auction", Gavel),
      leaf("Wholesale Products", "منتجات الجملة", "/admin/products/wholesale", Boxes),
      leaf("Digital Products", "المنتجات الرقمية", "/admin/products/digital", PackagePlus),
      leaf("Categories", "الفئات", "/admin/categories", FolderTree),
      leaf("Collections", "المجموعات", "/admin/collections", Layers),
      leaf("Brands", "العلامات التجارية", "/admin/brands", Tag),
      leaf("Attributes", "الخصائص", "/admin/attributes", SlidersHorizontal),
      leaf("Colors", "الألوان", "/admin/colors", Palette),
      leaf("Product Taxes", "ضرائب المنتجات", "/admin/taxes", Percent),
      leaf("Product Stock", "مخزون المنتجات", "/admin/stock", Warehouse),
    ],
  },
  {
    label: { en: "Inventory", ar: "المخزون" },
    items: [
      leaf("Warehouses", "المستودعات", "/admin/inventory/warehouses", Building2),
      leaf("Stock Transfers", "تحويلات المخزون", "/admin/inventory/stock-transfers", ArrowRightLeft),
      leaf("Stock Adjustments", "تسويات المخزون", "/admin/inventory/stock-adjustments", SlidersHorizontal),
      leaf("Stock Counts", "جرد المخزون", "/admin/inventory/stock-counts", ClipboardCheck),
      leaf("Product Batches", "دفعات المنتجات", "/admin/inventory/product-batches", PackageSearch),
    ],
  },
  {
    label: { en: "Orders & Sales", ar: "الطلبات والمبيعات" },
    items: [
      group("Sales", "المبيعات", ShoppingCart, [
        leaf("All Orders", "كل الطلبات", "/admin/orders/all"),
        leaf("In-house Orders", "الطلبات الداخلية", "/admin/orders/in-house"),
        leaf("Seller Orders", "طلبات البائعين", "/admin/orders/seller"),
      ]),
      leaf("POS System", "نظام نقاط البيع", "/admin/pos", ScanLine),
      leaf("Refunds", "المرتجعات", "/admin/refunds", Undo2, 12),
      leaf("Preorders", "الطلبات المسبقة", "/admin/preorders", CalendarClock),
      leaf("Abandoned Carts", "السلات المتروكة", "/admin/abandoned-carts", ShoppingBag),
      leaf("Transactions", "المعاملات", "/admin/transactions", Receipt),
      leaf("Invoices", "الفواتير", "/admin/invoices", FileText),
    ],
  },
  {
    label: { en: "Users", ar: "المستخدمون" },
    items: [
      leaf("Customers", "العملاء", "/admin/customers", Users),
      leaf("Sellers", "البائعون", "/admin/sellers", Store),
      leaf("Delivery Agents", "مندوبو التوصيل", "/admin/delivery-agents", Truck),
      leaf("Seller Verification", "التحقق من البائعين", "/admin/sellers/verification", ShieldCheck, 3),
      leaf("Payout Requests", "طلبات السحب", "/admin/sellers/payouts", HandCoins),
      leaf("Seller Settlements", "تسويات البائعين", "/admin/sellers/settlements", Banknote),
      leaf("Customer Groups", "مجموعات العملاء", "/admin/customer-groups", UsersRound),
    ],
  },
  {
    label: { en: "Shipping", ar: "الشحن" },
    items: [
      leaf("Shipping Zones", "مناطق الشحن", "/admin/shipping/zones", MapPin),
      leaf("Shipping Rates", "أسعار الشحن", "/admin/shipping/rates", Percent),
      leaf("Courier Companies", "شركات الشحن", "/admin/shipping/carriers", Truck),
      leaf("Pickup Points", "نقاط الاستلام", "/admin/shipping/pickup-locations", Route),
    ],
  },
  {
    label: { en: "Purchasing", ar: "المشتريات" },
    items: [
      leaf("Suppliers", "الموردون", "/admin/purchasing/suppliers", Store),
      leaf("Purchase Requests", "طلبات الشراء", "/admin/purchasing/requests", ClipboardList),
      leaf("Requests for Quotation", "طلبات عروض الأسعار", "/admin/purchasing/rfqs", FileText),
      leaf("Purchase Orders", "أوامر الشراء", "/admin/purchasing/orders", Receipt),
      leaf("Goods Receipts", "استلام البضائع", "/admin/purchasing/goods-receipts", PackagePlus),
      leaf("Purchase Returns", "مرتجعات الشراء", "/admin/purchasing/returns", Undo2),
    ],
  },
  {
    label: { en: "Marketing & Promotions", ar: "التسويق والعروض" },
    items: [
      leaf("Promotions & Offers", "العروض الترويجية", "/admin/promotions", Megaphone),
      leaf("Coupons", "الكوبونات", "/admin/coupons", TicketPercent),
      leaf("Flash Deals", "عروض الفلاش", "/admin/flash-deals", Zap),
      leaf("Marketing", "التسويق", "/admin/marketing", LineChart),
      leaf("Campaigns", "الحملات", "/admin/marketing/campaigns", Rocket),
      leaf("Audience Segments", "شرائح الجمهور", "/admin/marketing/segments", Users2),
      leaf("Marketing Calendar", "تقويم التسويق", "/admin/marketing/calendar", CalendarRange),
      leaf("Marketing Analytics", "تحليلات التسويق", "/admin/marketing/analytics", BarChart3),
      leaf("Affiliate System", "نظام الإحالة", "/admin/affiliate", Handshake),
      leaf("Club Point System", "نظام نقاط الولاء", "/admin/club-points", Award),
      leaf("Email Campaigns", "حملات البريد الإلكتروني", "/admin/email-campaigns", Mail),
      leaf("Push Notifications", "الإشعارات الفورية", "/admin/push-notifications", BellRing),
    ],
  },
  {
    label: { en: "Reports", ar: "التقارير" },
    items: [
      leaf("Report Center", "مركز التقارير", "/admin/reports", BarChart2),
      leaf("Sales Reports", "تقارير المبيعات", "/admin/reports/sales", PieChart),
      leaf("Product Reports", "تقارير المنتجات", "/admin/reports/products", ClipboardList),
      leaf("Seller Reports", "تقارير البائعين", "/admin/reports/sellers", Store),
      leaf("Customer Reports", "تقارير العملاء", "/admin/reports/customers", Users),
      leaf("Stock Reports", "تقارير المخزون", "/admin/reports/stock", Warehouse),
      leaf("Tax Reports", "تقارير الضرائب", "/admin/reports/taxes", Landmark),
      leaf("Commission Reports", "تقارير العمولات", "/admin/reports/commissions", PercentIcon),
    ],
  },
  {
    label: { en: "Finance", ar: "المالية" },
    items: [
      leaf("Tax Classes", "فئات الضرائب", "/admin/finance/tax-classes", Landmark),
      leaf("Expenses", "المصروفات", "/admin/finance/expenses", Calculator),
      leaf("Accounting Entries", "القيود المحاسبية", "/admin/finance/accounting-entries", Wallet),
    ],
  },
  {
    label: { en: "Content & Design", ar: "المحتوى والتصميم" },
    items: [
      leaf("Design Studio", "استوديو التصميم", "/admin/design-studio", LayoutTemplate),
      leaf("Theme Library", "مكتبة القوالب", "/admin/design-studio/themes", SwatchBook),
      leaf("Global Styles", "الأنماط العامة", "/admin/design-studio/global-styles", Palette),
      leaf("Header Builder", "منشئ الترويسة", "/admin/design-studio/header", PanelTop),
      leaf("Footer Builder", "منشئ التذييل", "/admin/design-studio/footer", PanelBottom),
      leaf("Homepage Builder", "منشئ الصفحة الرئيسية", "/admin/homepage-builder", Home),
      leaf("Banner Management", "إدارة البانرات", "/admin/banners", ImageIcon),
      leaf("Uploaded Files", "الملفات المرفوعة", "/admin/files", UploadCloud),
      leaf("Media Library", "مكتبة الوسائط", "/admin/media-library", Images),
      leaf("Pages", "الصفحات", "/admin/pages", FileStack),
      leaf("Blogs", "المدونة", "/admin/blogs", Newspaper),
      leaf("Blog Categories", "تصنيفات المدونة", "/admin/content/blog-categories", ListTree),
      leaf("Menus", "القوائم", "/admin/content/menus", ListTree),
      leaf("Popups", "النوافذ المنبثقة", "/admin/content/popups", LayoutTemplate),
    ],
  },
  {
    label: { en: "AI", ar: "الذكاء الاصطناعي" },
    items: [
      leaf("AI Studio", "استوديو الذكاء الاصطناعي", "/admin/ai-studio", Sparkles),
      leaf("AI Content Generator", "مولد المحتوى بالذكاء الاصطناعي", "/admin/ai-studio/content-generator", Wand2),
      leaf("AI Generation History", "سجل توليد الذكاء الاصطناعي", "/admin/ai-studio/history", History),
      leaf("AI Templates", "قوالب الذكاء الاصطناعي", "/admin/ai-studio/templates", FileSliders),
      leaf("AI Settings", "إعدادات الذكاء الاصطناعي", "/admin/ai-studio/settings", Cog),
    ],
  },
  {
    label: { en: "Communication", ar: "التواصل" },
    items: [
      leaf("Support & Communication", "الدعم والتواصل", "/admin/support", Headset),
      leaf("Support Tickets", "تذاكر الدعم", "/admin/support/tickets", MessageSquareText, 5),
      leaf("Contact Messages", "رسائل التواصل", "/admin/support/messages", Mail),
      leaf("Complaints", "الشكاوى", "/admin/support/complaints", MessageCircleWarning),
      leaf("FAQ / Knowledge Base", "الأسئلة الشائعة", "/admin/support/knowledge-base", BookOpenText),
      leaf("Notifications", "الإشعارات", "/admin/notifications", Bell),
      leaf("Live Chat", "المحادثة المباشرة", "/admin/support/live-chat", MessagesSquare),
    ],
  },
  {
    label: { en: "Integrations", ar: "التكاملات" },
    items: [
      leaf("Payment Gateways", "بوابات الدفع", "/admin/integrations/payments", CreditCard),
      leaf("Shipping Integrations", "تكاملات الشحن", "/admin/integrations/shipping", PackageSearch),
      leaf("OTP System", "نظام رمز التحقق", "/admin/integrations/otp", KeyRound),
      leaf("API Integrations", "تكاملات الواجهة البرمجية", "/admin/integrations/api", Plug),
      leaf("Webhooks", "الويب هوك", "/admin/integrations/webhooks", Webhook),
    ],
  },
  {
    label: { en: "Settings", ar: "الإعدادات" },
    items: [
      leaf("Setup & Configurations", "الإعداد والتكوين", "/admin/settings/setup", Settings2),
      leaf("Staff", "الموظفون", "/admin/settings/staff", UserCog),
      leaf("Roles & Permissions", "الأدوار والصلاحيات", "/admin/settings/roles", Lock),
      leaf("System Settings", "إعدادات النظام", "/admin/settings/system", Cog),
      leaf("Currency Settings", "إعدادات العملة", "/admin/settings/currency", Coins),
      leaf("Language Settings", "إعدادات اللغة", "/admin/settings/language", Languages),
      leaf("Add-on Manager", "مدير الإضافات", "/admin/settings/addons", PuzzleIcon),
      leaf("Database Backup", "نسخ قاعدة البيانات الاحتياطي", "/admin/settings/backup", DatabaseBackup),
      leaf("Activity Logs", "سجلات النشاط", "/admin/settings/activity-logs", History),
    ],
  },
];
