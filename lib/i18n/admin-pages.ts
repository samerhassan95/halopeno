export type AdminPageCopy = { title: string; subtitle?: string };

export const ADMIN_PAGES_AR: Record<string, AdminPageCopy> = {
  "products/all": {
    title: "كل المنتجات",
    subtitle: "جميع المنتجات عبر كتالوجات المنصة والبائعين",
  },
  "products/wholesale": {
    title: "منتجات الجملة",
    subtitle: "منتجات مُعدّة للطلبات بالجملة وقطاع الأعمال",
  },
  "products/auction": {
    title: "منتجات المزاد",
    subtitle: "مزادات المنتجات الجارية والمجدولة",
  },
  "products/reviews": {
    title: "تقييمات المنتجات",
    subtitle: "تقييمات العملاء والمراجعات المكتوبة",
  },
  "products/queries": {
    title: "استفسارات المنتجات",
    subtitle: "أسئلة العملاء بانتظار الرد",
  },
  "products/digital": {
    title: "المنتجات الرقمية",
    subtitle: "منتجات قابلة للتنزيل والتسليم الرقمي",
  },
  categories: {
    title: "الفئات",
    subtitle: "فئات المنتجات وهيكل العرض التجاري",
  },
  brands: {
    title: "العلامات التجارية",
    subtitle: "دليل المصنّعين والعلامات التجارية",
  },
  attributes: {
    title: "الخصائص",
    subtitle: "خصائص منتجات قابلة لإعادة الاستخدام للتصفية والمتغيرات",
  },
  colors: {
    title: "الألوان",
    subtitle: "إدارة القيم القابلة لإعادة الاستخدام لخصائص المنتجات مثل الألوان والمقاسات والمواد والتخزين والأنماط وغيرها.",
  },
  taxes: {
    title: "ضرائب المنتجات",
    subtitle: "إدارة فئات الضرائب ومعدلاتها وتعييناتها على الكتالوج.",
  },
  stock: {
    title: "مخزون المنتجات",
    subtitle: "إدارة مستويات المخزون ومخزون المستودعات والحركات والحجوزات وإعادة التوريد.",
  },
  collections: {
    title: "المجموعات",
    subtitle: "تجميعات منتجات منسّقة للعرض التجاري",
  },
  "orders/all": {
    title: "كل الطلبات",
    subtitle: "جميع الطلبات المقدّمة عبر المنصة",
  },
  "orders/in-house": {
    title: "الطلبات الداخلية",
    subtitle: "طلبات تُنفَّذ مباشرة من المنصة",
  },
  "orders/seller": {
    title: "طلبات البائعين",
    subtitle: "طلبات يُنفّذها بائعو السوق",
  },
  refunds: {
    title: "المرتجعات",
    subtitle: "طلبات الاسترجاع عبر جميع الطلبات",
  },
  preorders: {
    title: "الطلبات المسبقة",
    subtitle: "منتجات متاحة للطلب المسبق قبل التوفر",
  },
  "abandoned-carts": {
    title: "السلات المتروكة",
    subtitle: "سلات تُركت دون إتمام الدفع",
  },
  transactions: {
    title: "المعاملات",
    subtitle: "سجل معاملات بوابات الدفع",
  },
  invoices: {
    title: "الفواتير",
    subtitle: "فواتير صادرة للطلبات المكتملة",
  },
  sellers: {
    title: "البائعون",
    subtitle: "بائعو السوق ومتاجرهم",
  },
  "sellers/verification": {
    title: "التحقق من البائعين",
    subtitle: "بائعون بانتظار الموافقة للبيع على المنصة",
  },
  "sellers/payouts": {
    title: "طلبات السحب",
    subtitle: "طلبات سحب البائعين بانتظار المعالجة",
  },
  "sellers/settlements": {
    title: "تسويات البائعين",
    subtitle: "تسويات عمولات دورية لكل بائع",
  },
  "delivery-agents": {
    title: "مندوبو التوصيل",
    subtitle: "سائقون ومندوبون يتولّون التوصيل للميل الأخير",
  },
  "customer-groups": {
    title: "مجموعات العملاء",
    subtitle: "شرائح تُستخدم للتسعير والخصومات حسب المجموعة",
  },
  customers: {
    title: "العملاء",
    subtitle: "عملاء المنصة وحساباتهم",
  },
  promotions: {
    title: "العروض الترويجية",
    subtitle: "قواعد ترويجية على مستوى السلة والمنتج",
  },
  "marketing/campaigns": {
    title: "الحملات",
    subtitle: "حملات تسويقية متعددة القنوات عبر البريد والإشعارات والرسائل والشبكات",
  },
  coupons: {
    title: "الكوبونات",
    subtitle: "أكواد خصم يمكن للعملاء استخدامها عند الدفع",
  },
  "flash-deals": {
    title: "عروض الفلاش",
    subtitle: "حملات خصم محدودة الوقت",
  },
  affiliate: {
    title: "نظام الإحالة",
    subtitle: "شركاء الإحالة وأداء الإحالات",
  },
  "club-points": {
    title: "نظام نقاط الولاء",
    subtitle: "معاملات نقاط الولاء عبر جميع العملاء",
  },
  "email-campaigns": {
    title: "حملات البريد الإلكتروني",
    subtitle: "حملات تسويق جماعية عبر البريد الإلكتروني",
  },
  "push-notifications": {
    title: "الإشعارات الفورية",
    subtitle: "حملات إشعارات الجوال والمتصفح",
  },
  banners: {
    title: "إدارة البانرات",
    subtitle: "بانرات ترويجية تُعرض عبر واجهة المتجر",
  },
  "ai-studio/history": {
    title: "سجل توليد الذكاء الاصطناعي",
    subtitle: "سجل عمليات توليد المحتوى بمساعدة الذكاء الاصطناعي",
  },
  files: {
    title: "الملفات المرفوعة",
    subtitle: "كل ملف رُفع إلى مكتبة الوسائط",
  },
  "media-library": {
    title: "مكتبة الوسائط",
    subtitle: "صور وفيديوهات ومستندات متاحة عبر المنصة",
  },
  pages: {
    title: "الصفحات",
    subtitle: "صفحات ثابتة للمتجر مثل من نحن والأسئلة الشائعة",
  },
  blogs: {
    title: "المدونة",
    subtitle: "محتوى تحريري ومقالات مدونة المتجر",
  },
  "support/tickets": {
    title: "تذاكر الدعم",
    subtitle: "محادثات دعم العملاء وحالاتها",
  },
  "support/messages": {
    title: "رسائل التواصل",
    subtitle: "رسائل مُرسلة عبر نموذج التواصل في المتجر",
  },
  "support/complaints": {
    title: "الشكاوى",
    subtitle: "شكاوى رسمية مقدّمة من العملاء",
  },
  "support/knowledge-base": {
    title: "الأسئلة الشائعة",
    subtitle: "مقالات مساعدة للخدمة الذاتية",
  },
  notifications: {
    title: "الإشعارات",
    subtitle: "سجل إشعارات المنصة",
  },
  "integrations/payments": {
    title: "بوابات الدفع",
    subtitle: "مزوّدو الدفع المتصلون",
  },
  "integrations/shipping": {
    title: "تكاملات الشحن",
    subtitle: "شركات الشحن ومجمّعات الشحن المتصلة",
  },
  "integrations/api": {
    title: "تكاملات الواجهة البرمجية",
    subtitle: "مفاتيح واجهة برمجية صادرة لتكاملات الطرف الثالث",
  },
  "integrations/webhooks": {
    title: "الويب هوك",
    subtitle: "اشتراكات الويب هوك الصادرة",
  },
  "settings/staff": {
    title: "الموظفون",
    subtitle: "أعضاء الفريق الداخلي الذين لديهم صلاحية الوصول للوحة التحكم",
  },
  "settings/roles": {
    title: "الأدوار والصلاحيات",
    subtitle: "أدوار الوصول المعيّنة للموظفين",
  },
  "settings/currency": {
    title: "إعدادات العملة",
    subtitle: "العملات المدعومة عند الدفع",
  },
  "settings/language": {
    title: "إعدادات اللغة",
    subtitle: "اللغات المتاحة في المتجر ولوحة التحكم",
  },
  "settings/activity-logs": {
    title: "سجلات النشاط",
    subtitle: "سجل تدقيق لإجراءات الموظفين عبر المنصة",
  },
  "settings/setup": {
    title: "الإعداد والتكوين",
    subtitle: "إعدادات المنصة بنظام المفتاح والقيمة",
  },
  "settings/system": {
    title: "إعدادات النظام",
    subtitle: "قيم التكوين العامة للنظام",
  },
  "reports/commissions": {
    title: "تقارير العمولات",
    subtitle: "قواعد العمولة المطبّقة على البائعين والفئات والعلامات التجارية",
  },
  "reports/stock": {
    title: "تقارير المخزون",
    subtitle: "مستويات المخزون عبر جميع المستودعات",
  },
  "inventory/warehouses": {
    title: "المستودعات",
    subtitle: "مواقع التخزين المستخدمة لتنفيذ الطلبات",
  },
  "inventory/stock-transfers": {
    title: "تحويلات المخزون",
    subtitle: "مخزون منقول بين المستودعات",
  },
  "inventory/stock-adjustments": {
    title: "تسويات المخزون",
    subtitle: "تصحيحات مخزون يدوية مسجّلة لكل مستودع",
  },
  "inventory/stock-counts": {
    title: "جرد المخزون",
    subtitle: "جلسات الجرد الفعلي للمخزون",
  },
  "inventory/product-batches": {
    title: "دفعات المنتجات",
    subtitle: "تتبع الدفعات والأرقام التسلسلية وتواريخ الانتهاء للمخزون",
  },
  "shipping/zones": {
    title: "مناطق الشحن",
    subtitle: "مناطق جغرافية تُستخدم لتسعير الشحن",
  },
  "shipping/rates": {
    title: "أسعار الشحن",
    subtitle: "أسعار تُطبَّق ضمن كل منطقة شحن",
  },
  "shipping/carriers": {
    title: "شركات الشحن",
    subtitle: "شركات النقل المتاحة لتنفيذ الشحنات",
  },
  "shipping/pickup-locations": {
    title: "نقاط الاستلام",
    subtitle: "مواقع يمكن للعملاء استلام الطلبات منها",
  },
  "finance/tax-classes": {
    title: "فئات الضرائب",
    subtitle: "تجميعات تُستخدم لتطبيق معدلات الضريبة على المنتجات",
  },
  "finance/expenses": {
    title: "المصروفات",
    subtitle: "مصروفات تشغيلية مسجّلة على النشاط",
  },
  "finance/accounting-entries": {
    title: "القيود المحاسبية",
    subtitle: "دفتر قيد مزدوج للمدين والدائن",
  },
  "purchasing/suppliers": {
    title: "الموردون",
    subtitle: "جهات يشتري منها النشاط المخزون",
  },
  "purchasing/requests": {
    title: "طلبات الشراء",
    subtitle: "طلبات داخلية لإعادة تزويد المخزون",
  },
  "purchasing/rfqs": {
    title: "طلبات عروض الأسعار",
    subtitle: "طلبات عروض أسعار مُرسلة للموردين",
  },
  "purchasing/orders": {
    title: "أوامر الشراء",
    subtitle: "أوامر مؤكدة مُقدَّمة للموردين",
  },
  "purchasing/goods-receipts": {
    title: "استلام البضائع",
    subtitle: "مخزون وارد مسجّل مقابل أوامر الشراء",
  },
  "purchasing/returns": {
    title: "مرتجعات الشراء",
    subtitle: "مخزون مُعاد للموردين",
  },
  "content/menus": {
    title: "القوائم",
    subtitle: "قوائم تنقل تُعرض على واجهة المتجر",
  },
  "content/popups": {
    title: "النوافذ المنبثقة",
    subtitle: "نوافذ منبثقة وإعلانات على الموقع",
  },
  "content/blog-categories": {
    title: "تصنيفات المدونة",
    subtitle: "تصنيفات لتنظيم مقالات المدونة",
  },
};
