export type ColumnType = "text" | "currency" | "number" | "date" | "badge" | "boolean";

export interface ResourceColumn {
  key: string;
  label: string;
  type?: ColumnType;
}

export interface ResourceField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
}

export interface ResourcePageConfig {
  route: string;
  endpoint: string;
  title: string;
  subtitle?: string;
  columns: ResourceColumn[];
  createFields?: ResourceField[];
  /** Fields available when editing an existing row. Can be used without enabling creation. */
  updateFields?: ResourceField[];
  clientFilterKey?: string;
  clientFilterValue?: string;
  /** When set, "Add new" and row "Edit" navigate to a dedicated page instead of the generic dialog. */
  detailRoute?: string;
}

export const resourcePages: ResourcePageConfig[] = [
  // ---- Products & Catalog ----
  {
    route: "products/all",
    endpoint: "/commerce/products",
    title: "All Products",
    subtitle: "Every product across in-house and seller catalogs",
    columns: [
      { key: "name", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "categoryName", label: "Category" },
      { key: "regularPrice", label: "Price", type: "currency" },
      { key: "stock", label: "Stock", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
    createFields: [
      { key: "name", label: "Product name", type: "text", required: true },
      { key: "sku", label: "SKU", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "regularPrice", label: "Regular price", type: "number", required: true },
      { key: "stock", label: "Stock", type: "number" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED", "OUT_OF_STOCK", "DISABLED"],
      },
    ],
    detailRoute: "products/all",
  },
  {
    route: "products/wholesale",
    endpoint: "/commerce/products",
    title: "Wholesale Products",
    subtitle: "Products configured for bulk/B2B ordering",
    columns: [
      { key: "name", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "wholesalePrice", label: "Wholesale price", type: "currency" },
      { key: "stock", label: "Stock", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
    clientFilterKey: "type",
    clientFilterValue: "WHOLESALE",
  },
  {
    route: "products/auction",
    endpoint: "/commerce/auction-details",
    title: "Auction Products",
    subtitle: "Live and scheduled product auctions",
    columns: [
      { key: "startingBid", label: "Starting bid", type: "currency" },
      { key: "reservePrice", label: "Reserve price", type: "currency" },
      { key: "startAt", label: "Starts", type: "date" },
      { key: "endAt", label: "Ends", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "products/reviews",
    endpoint: "/commerce/reviews",
    title: "Product Reviews",
    subtitle: "Customer ratings and written reviews",
    columns: [
      { key: "rating", label: "Rating", type: "number" },
      { key: "title", label: "Title" },
      { key: "body", label: "Review" },
      { key: "isVerified", label: "Verified", type: "boolean" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "products/queries",
    endpoint: "/commerce/product-questions",
    title: "Product Queries",
    subtitle: "Customer questions awaiting an answer",
    columns: [
      { key: "question", label: "Question" },
      { key: "answer", label: "Answer" },
      { key: "isPublic", label: "Public", type: "boolean" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "categories",
    endpoint: "/commerce/categories",
    title: "Categories",
    subtitle: "Product categories and merchandising hierarchy",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "displayOrder", label: "Order", type: "number" },
      { key: "isFeatured", label: "Featured", type: "boolean" },
      { key: "status", label: "Status", type: "badge" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "isFeatured", label: "Featured", type: "checkbox" },
    ],
  },
  {
    route: "brands",
    endpoint: "/commerce/brands",
    title: "Brands",
    subtitle: "Manufacturer and brand directory",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "website", label: "Website" },
      { key: "isFeatured", label: "Featured", type: "boolean" },
      { key: "status", label: "Status", type: "badge" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "website", label: "Website", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    route: "attributes",
    endpoint: "/commerce/attributes",
    title: "Attributes",
    subtitle: "Reusable product attributes for filtering and variants",
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "isFilterable", label: "Filterable", type: "boolean" },
      { key: "isRequired", label: "Required", type: "boolean" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "type", label: "Type", type: "select", options: ["text", "number", "dropdown", "color", "boolean", "date"] },
      { key: "isFilterable", label: "Filterable", type: "checkbox" },
      { key: "isRequired", label: "Required", type: "checkbox" },
    ],
  },
  {
    route: "colors",
    endpoint: "/commerce/attribute-values",
    title: "Colors & Attribute Values",
    subtitle: "Values available for product attributes such as color and size",
    columns: [
      { key: "value", label: "Value" },
      { key: "colorHex", label: "Color" },
      { key: "displayOrder", label: "Order", type: "number" },
    ],
  },
  {
    route: "taxes",
    endpoint: "/finance/tax-rates",
    title: "Product Taxes",
    subtitle: "Tax rates applied to products by country and region",
    columns: [
      { key: "country", label: "Country" },
      { key: "state", label: "State" },
      { key: "rate", label: "Rate", type: "number" },
      { key: "isInclusive", label: "Inclusive", type: "boolean" },
      { key: "isCompound", label: "Compound", type: "boolean" },
    ],
  },
  {
    route: "stock",
    endpoint: "/inventory/stock-items",
    title: "Product Stock",
    subtitle: "Live stock levels across every warehouse",
    columns: [
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "reserved", label: "Reserved", type: "number" },
      { key: "damaged", label: "Damaged", type: "number" },
      { key: "incoming", label: "Incoming", type: "number" },
    ],
  },

  // ---- Sales / Orders ----
  {
    route: "orders/all",
    endpoint: "/sales/orders",
    title: "All Orders",
    subtitle: "Every order placed across the platform",
    columns: [
      { key: "orderNumber", label: "Order" },
      { key: "customerName", label: "Customer" },
      { key: "itemCount", label: "Items", type: "number" },
      { key: "channel", label: "Channel", type: "badge" },
      { key: "total", label: "Total", type: "currency" },
      { key: "paymentStatus", label: "Payment", type: "badge" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    updateFields: [
      {
        key: "status",
        label: "Order status",
        type: "select",
        required: true,
        options: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "READY_FOR_SHIPMENT",
          "SHIPPED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
          "FAILED",
          "RETURNED",
          "REFUNDED",
        ],
      },
      { key: "internalNotes", label: "Internal notes", type: "textarea" },
    ],
    detailRoute: "orders/all",
  },
  {
    route: "orders/in-house",
    endpoint: "/sales/orders",
    title: "In-house Orders",
    subtitle: "Orders fulfilled directly by the platform",
    columns: [
      { key: "orderNumber", label: "Order" },
      { key: "total", label: "Total", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    clientFilterKey: "channel",
    clientFilterValue: "IN_HOUSE",
    updateFields: [
      {
        key: "status",
        label: "Order status",
        type: "select",
        required: true,
        options: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "READY_FOR_SHIPMENT",
          "SHIPPED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
          "FAILED",
          "RETURNED",
          "REFUNDED",
        ],
      },
      { key: "internalNotes", label: "Internal notes", type: "textarea" },
    ],
  },
  {
    route: "orders/seller",
    endpoint: "/sales/orders",
    title: "Seller Orders",
    subtitle: "Orders fulfilled by marketplace sellers",
    columns: [
      { key: "orderNumber", label: "Order" },
      { key: "total", label: "Total", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    clientFilterKey: "channel",
    clientFilterValue: "SELLER",
  },
  {
    route: "refunds",
    endpoint: "/sales/refunds",
    title: "Refunds",
    subtitle: "Refund requests across all orders",
    columns: [
      { key: "amount", label: "Amount", type: "currency" },
      { key: "reason", label: "Reason" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Requested", type: "date" },
    ],
  },
  {
    route: "preorders",
    endpoint: "/commerce/preorder-details",
    title: "Preorders",
    subtitle: "Products open for preorder ahead of availability",
    columns: [
      { key: "startAt", label: "Starts", type: "date" },
      { key: "endAt", label: "Ends", type: "date" },
      { key: "expectedAvailable", label: "Available from", type: "date" },
      { key: "maxQuantity", label: "Max qty", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "abandoned-carts",
    endpoint: "/sales/abandoned-carts",
    title: "Abandoned Carts",
    subtitle: "Carts left without completing checkout",
    columns: [
      { key: "guestEmail", label: "Email" },
      { key: "cartValue", label: "Cart value", type: "currency" },
      { key: "recoveryStatus", label: "Recovery", type: "badge" },
      { key: "recoveredRevenue", label: "Recovered", type: "currency" },
      { key: "lastActivity", label: "Last activity", type: "date" },
    ],
  },
  {
    route: "transactions",
    endpoint: "/sales/transactions",
    title: "Transactions",
    subtitle: "Payment gateway transaction ledger",
    columns: [
      { key: "type", label: "Type" },
      { key: "gateway", label: "Gateway" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "invoices",
    endpoint: "/sales/invoices",
    title: "Invoices",
    subtitle: "Issued invoices for completed orders",
    columns: [
      { key: "invoiceNumber", label: "Invoice #" },
      { key: "total", label: "Total", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
      { key: "issuedAt", label: "Issued", type: "date" },
    ],
  },

  // ---- Users ----
  {
    route: "sellers",
    endpoint: "/marketplace/sellers",
    title: "Sellers",
    subtitle: "Marketplace vendors and their storefronts",
    columns: [
      { key: "shopName", label: "Shop" },
      { key: "name", label: "Owner" },
      { key: "email", label: "Email" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "sellers/verification",
    endpoint: "/marketplace/sellers",
    title: "Seller Verification",
    subtitle: "Sellers awaiting approval to sell on the platform",
    columns: [
      { key: "shopName", label: "Shop" },
      { key: "name", label: "Owner" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status", type: "badge" },
    ],
    clientFilterKey: "status",
    clientFilterValue: "PENDING",
    detailRoute: "sellers/verification",
  },
  {
    route: "delivery-agents",
    endpoint: "/shipping/delivery-agents",
    title: "Delivery Agents",
    subtitle: "Riders and drivers handling last-mile delivery",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "serviceArea", label: "Service area" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "customer-groups",
    endpoint: "/customers/customer-groups",
    title: "Customer Groups",
    subtitle: "Segments used for group-based pricing and discounts",
    columns: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      { key: "discountPct", label: "Discount %", type: "number" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "discountPct", label: "Discount %", type: "number" },
    ],
  },

  // ---- Marketing ----
  {
    route: "promotions",
    endpoint: "/marketing/promotions",
    title: "Promotions & Offers",
    subtitle: "Cart and product-level promotional rules",
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "discountValue", label: "Discount", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  {
    route: "marketing/campaigns",
    endpoint: "/marketing/campaigns",
    title: "Campaigns",
    subtitle: "Multi-channel marketing campaigns across email, push, SMS and social",
    columns: [
      { key: "name", label: "Campaign" },
      { key: "type", label: "Type" },
      { key: "channels", label: "Channels" },
      { key: "segment", label: "Audience" },
      { key: "startsAt", label: "Start date", type: "date" },
      { key: "endsAt", label: "End date", type: "date" },
      { key: "budget", label: "Budget", type: "currency" },
      { key: "revenue", label: "Revenue", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
    ],
    createFields: [
      { key: "name", label: "Campaign name", type: "text", required: true },
      { key: "type", label: "Type", type: "select", options: ["seasonal", "product_launch", "retention", "acquisition"] },
      { key: "segment", label: "Audience segment", type: "text" },
      { key: "goal", label: "Goal", type: "text" },
      { key: "budget", label: "Budget", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["draft", "scheduled", "active", "completed", "cancelled"] },
    ],
    detailRoute: "marketing/campaigns",
  },
  {
    route: "coupons",
    endpoint: "/marketing/coupons",
    title: "Coupons",
    subtitle: "Discount codes customers can redeem at checkout",
    columns: [
      { key: "code", label: "Code" },
      { key: "discountType", label: "Type", type: "badge" },
      { key: "discountValue", label: "Value", type: "number" },
      { key: "usedCount", label: "Uses", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "code", label: "Code", type: "text", required: true },
      { key: "discountType", label: "Type", type: "select", options: ["PERCENTAGE", "FIXED", "FREE_SHIPPING"] },
      { key: "discountValue", label: "Value", type: "number", required: true },
      { key: "usageLimit", label: "Usage limit", type: "number" },
    ],
  },
  {
    route: "flash-deals",
    endpoint: "/marketing/flash-deals",
    title: "Flash Deals",
    subtitle: "Time-boxed discount campaigns",
    columns: [
      { key: "title", label: "Title" },
      { key: "discountValue", label: "Discount", type: "number" },
      { key: "startsAt", label: "Starts", type: "date" },
      { key: "endsAt", label: "Ends", type: "date" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "discountValue", label: "Discount value", type: "number", required: true },
      { key: "stockAllocated", label: "Stock allocated", type: "number" },
    ],
  },
  {
    route: "affiliate",
    endpoint: "/marketing/affiliates",
    title: "Affiliate System",
    subtitle: "Affiliate partners and referral performance",
    columns: [
      { key: "name", label: "Name" },
      { key: "referralCode", label: "Referral code" },
      { key: "commissionRate", label: "Commission %", type: "number" },
      { key: "balance", label: "Balance", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "club-points",
    endpoint: "/customers/loyalty-transactions",
    title: "Club Point System",
    subtitle: "Loyalty point transactions across all customers",
    columns: [
      { key: "points", label: "Points", type: "number" },
      { key: "type", label: "Type", type: "badge" },
      { key: "reason", label: "Reason" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "email-campaigns",
    endpoint: "/marketing/email-campaigns",
    title: "Email Campaigns",
    subtitle: "Bulk email marketing campaigns",
    columns: [
      { key: "name", label: "Name" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status", type: "badge" },
      { key: "openRate", label: "Open rate", type: "number" },
      { key: "clickRate", label: "Click rate", type: "number" },
    ],
    createFields: [
      { key: "name", label: "Campaign name", type: "text", required: true },
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    route: "push-notifications",
    endpoint: "/marketing/push-campaigns",
    title: "Push Notifications",
    subtitle: "Mobile and browser push campaigns",
    columns: [
      { key: "title", label: "Title" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status", type: "badge" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "message", label: "Message", type: "textarea", required: true },
    ],
  },

  // ---- Content ----
  {
    route: "banners",
    endpoint: "/content/banners",
    title: "Banner Management",
    subtitle: "Promotional banners shown across the storefront",
    columns: [
      { key: "title", label: "Title" },
      { key: "placement", label: "Placement" },
      { key: "displayOrder", label: "Order", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "image", label: "Image URL", type: "text", required: true },
      { key: "link", label: "Link", type: "text" },
      { key: "placement", label: "Placement", type: "text" },
    ],
  },
  {
    route: "ai-studio/history",
    endpoint: "/ai-studio/ai-generation-logs",
    title: "AI Generation History",
    subtitle: "History of AI-assisted content generations",
    columns: [
      { key: "feature", label: "Feature" },
      { key: "model", label: "Model" },
      { key: "outputText", label: "Output" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "files",
    endpoint: "/content/media-files",
    title: "Uploaded Files",
    subtitle: "Every file uploaded to the media library",
    columns: [
      { key: "fileName", label: "File name" },
      { key: "mimeType", label: "Type" },
      { key: "folder", label: "Folder" },
      { key: "usageCount", label: "Used in", type: "number" },
    ],
  },
  {
    route: "media-library",
    endpoint: "/content/media-files",
    title: "Media Library",
    subtitle: "Images, videos and documents available across the platform",
    columns: [
      { key: "fileName", label: "File name" },
      { key: "mimeType", label: "Type" },
      { key: "size", label: "Size (KB)", type: "number" },
      { key: "createdAt", label: "Uploaded", type: "date" },
    ],
  },
  {
    route: "pages",
    endpoint: "/content/pages",
    title: "Pages",
    subtitle: "Static storefront pages such as About and FAQ",
    columns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status", type: "badge" },
      { key: "updatedAt", label: "Updated", type: "date" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea" },
    ],
  },
  {
    route: "blogs",
    endpoint: "/content/blog-posts",
    title: "Blogs",
    subtitle: "Editorial content and storefront blog posts",
    columns: [
      { key: "title", label: "Title" },
      { key: "author", label: "Author" },
      { key: "status", label: "Status", type: "badge" },
      { key: "publishedAt", label: "Published", type: "date" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "author", label: "Author", type: "text" },
      { key: "content", label: "Content", type: "textarea" },
    ],
  },

  // ---- Support ----
  {
    route: "support/tickets",
    endpoint: "/support/support-tickets",
    title: "Support Tickets",
    subtitle: "Customer support conversations and their status",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "priority", label: "Priority", type: "badge" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Opened", type: "date" },
    ],
    detailRoute: "support/tickets",
  },
  {
    route: "support/messages",
    endpoint: "/support/contact-messages",
    title: "Contact Messages",
    subtitle: "Messages submitted through the storefront contact form",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  {
    route: "notifications",
    endpoint: "/notifications/notifications",
    title: "Notifications",
    subtitle: "Platform-wide notification history",
    columns: [
      { key: "title", label: "Title" },
      { key: "channel", label: "Channel", type: "badge" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },

  // ---- Integrations ----
  {
    route: "integrations/payments",
    endpoint: "/integrations/integration-connections",
    title: "Payment Gateways",
    subtitle: "Connected payment providers",
    columns: [
      { key: "provider", label: "Provider" },
      { key: "status", label: "Status", type: "badge" },
      { key: "lastSyncAt", label: "Last sync", type: "date" },
    ],
    clientFilterKey: "category",
    clientFilterValue: "payment",
  },
  {
    route: "integrations/shipping",
    endpoint: "/integrations/integration-connections",
    title: "Shipping Integrations",
    subtitle: "Connected carriers and shipping aggregators",
    columns: [
      { key: "provider", label: "Provider" },
      { key: "status", label: "Status", type: "badge" },
      { key: "lastSyncAt", label: "Last sync", type: "date" },
    ],
    clientFilterKey: "category",
    clientFilterValue: "shipping",
  },
  {
    route: "integrations/api",
    endpoint: "/integrations/api-keys",
    title: "API Integrations",
    subtitle: "API keys issued for third-party integrations",
    columns: [
      { key: "name", label: "Name" },
      { key: "keyPrefix", label: "Key prefix" },
      { key: "revoked", label: "Revoked", type: "boolean" },
      { key: "lastUsedAt", label: "Last used", type: "date" },
    ],
    createFields: [{ key: "name", label: "Name", type: "text", required: true }],
  },
  {
    route: "integrations/webhooks",
    endpoint: "/integrations/webhooks",
    title: "Webhooks",
    subtitle: "Outbound webhook subscriptions",
    columns: [
      { key: "url", label: "URL" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    createFields: [{ key: "url", label: "Endpoint URL", type: "text", required: true }],
  },

  // ---- Administration / Settings ----
  {
    route: "settings/staff",
    endpoint: "/administration/users",
    title: "Staff",
    subtitle: "Internal team members with dashboard access",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "jobTitle", label: "Job title" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status", type: "badge" },
    ],
    detailRoute: "settings/staff",
  },
  {
    route: "settings/roles",
    endpoint: "/administration/roles",
    title: "Roles & Permissions",
    subtitle: "Access roles assigned to staff members",
    columns: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      { key: "isSystem", label: "System role", type: "boolean" },
    ],
    detailRoute: "settings/roles",
  },
  {
    route: "settings/currency",
    endpoint: "/administration/currencies",
    title: "Currency Settings",
    subtitle: "Currencies supported at checkout",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "symbol", label: "Symbol" },
      { key: "exchangeRate", label: "Rate", type: "number" },
      { key: "isDefault", label: "Default", type: "boolean" },
    ],
  },
  {
    route: "settings/language",
    endpoint: "/administration/languages",
    title: "Language Settings",
    subtitle: "Languages available on the storefront and admin",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "direction", label: "Direction" },
      { key: "isDefault", label: "Default", type: "boolean" },
    ],
  },
  {
    route: "settings/activity-logs",
    endpoint: "/administration/activity-logs",
    title: "Activity Logs",
    subtitle: "Audit trail of staff actions across the platform",
    columns: [
      { key: "action", label: "Action" },
      { key: "entityType", label: "Entity" },
      { key: "ipAddress", label: "IP address" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "settings/setup",
    endpoint: "/settings/settings",
    title: "Setup & Configurations",
    subtitle: "Key-value platform configuration",
    columns: [
      { key: "group", label: "Group" },
      { key: "key", label: "Key" },
      { key: "updatedAt", label: "Updated", type: "date" },
    ],
  },
  {
    route: "settings/system",
    endpoint: "/settings/settings",
    title: "System Settings",
    subtitle: "Global system configuration values",
    columns: [
      { key: "group", label: "Group" },
      { key: "key", label: "Key" },
      { key: "updatedAt", label: "Updated", type: "date" },
    ],
  },

  // ---- Reports (mapped to their closest live resource) ----
  {
    route: "reports/commissions",
    endpoint: "/marketplace/commissions",
    title: "Commission Reports",
    subtitle: "Commission rules applied across sellers, categories and brands",
    columns: [
      { key: "type", label: "Type", type: "badge" },
      { key: "value", label: "Value", type: "number" },
      { key: "isGlobal", label: "Global", type: "boolean" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "reports/stock",
    endpoint: "/inventory/stock-items",
    title: "Stock Reports",
    subtitle: "Stock levels across every warehouse",
    columns: [
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "reserved", label: "Reserved", type: "number" },
      { key: "damaged", label: "Damaged", type: "number" },
    ],
  },

  // ---- Products: extra views ----
  {
    route: "products/digital",
    endpoint: "/commerce/products",
    title: "Digital Products",
    subtitle: "Downloadable and digital-delivery products",
    columns: [
      { key: "name", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "regularPrice", label: "Price", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
    ],
    clientFilterKey: "type",
    clientFilterValue: "DIGITAL",
  },
  {
    route: "collections",
    endpoint: "/commerce/collections",
    title: "Collections",
    subtitle: "Curated product groupings for merchandising",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  // ---- Inventory ----
  {
    route: "inventory/warehouses",
    endpoint: "/inventory/warehouses",
    title: "Warehouses",
    subtitle: "Storage locations used for order fulfillment",
    columns: [
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "managerName", label: "Manager" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "code", label: "Code", type: "text", required: true },
      { key: "address", label: "Address", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "managerName", label: "Manager", type: "text" },
    ],
  },
  {
    route: "inventory/stock-transfers",
    endpoint: "/inventory/stock-transfers",
    title: "Stock Transfers",
    subtitle: "Stock moved between warehouses",
    columns: [
      { key: "fromWarehouseId", label: "From warehouse" },
      { key: "toWarehouseId", label: "To warehouse" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "inventory/stock-adjustments",
    endpoint: "/inventory/stock-adjustments",
    title: "Stock Adjustments",
    subtitle: "Manual stock corrections recorded per warehouse",
    columns: [
      { key: "warehouseId", label: "Warehouse" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "reason", label: "Reason" },
      { key: "type", label: "Type", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "inventory/stock-counts",
    endpoint: "/inventory/stock-counts",
    title: "Stock Counts",
    subtitle: "Physical inventory count sessions",
    columns: [
      { key: "reference", label: "Reference" },
      { key: "warehouseId", label: "Warehouse" },
      { key: "countedBy", label: "Counted by" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "inventory/product-batches",
    endpoint: "/inventory/product-batches",
    title: "Product Batches",
    subtitle: "Lot, serial and expiry tracking for stock",
    columns: [
      { key: "batchNumber", label: "Batch #" },
      { key: "serialNumber", label: "Serial #" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "expiryDate", label: "Expiry", type: "date" },
    ],
  },

  // ---- Sellers: payouts & settlements ----
  {
    route: "sellers/payouts",
    endpoint: "/marketplace/payouts",
    title: "Payout Requests",
    subtitle: "Seller withdrawal requests awaiting processing",
    columns: [
      { key: "sellerId", label: "Seller" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "method", label: "Method", type: "badge" },
      { key: "status", label: "Status", type: "badge" },
      { key: "requestedAt", label: "Requested", type: "date" },
    ],
    updateFields: [
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["PENDING", "APPROVED", "REJECTED", "PROCESSING", "PAID", "FAILED"],
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    route: "sellers/settlements",
    endpoint: "/finance/seller-settlements",
    title: "Seller Settlements",
    subtitle: "Periodic commission settlements per seller",
    columns: [
      { key: "sellerId", label: "Seller" },
      { key: "periodStart", label: "Period start", type: "date" },
      { key: "periodEnd", label: "Period end", type: "date" },
      { key: "grossSales", label: "Gross sales", type: "currency" },
      { key: "commission", label: "Commission", type: "currency" },
      { key: "netPayable", label: "Net payable", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },

  // ---- Shipping ----
  {
    route: "shipping/zones",
    endpoint: "/shipping/shipping-zones",
    title: "Shipping Zones",
    subtitle: "Geographic zones used to price shipping",
    columns: [
      { key: "name", label: "Name" },
      { key: "countries", label: "Countries" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    createFields: [{ key: "name", label: "Name", type: "text", required: true }],
  },
  {
    route: "shipping/rates",
    endpoint: "/shipping/shipping-rates",
    title: "Shipping Rates",
    subtitle: "Rates applied within each shipping zone",
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type", type: "badge" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "minOrderValue", label: "Min order", type: "currency" },
      { key: "freeShippingThreshold", label: "Free over", type: "currency" },
    ],
  },
  {
    route: "shipping/carriers",
    endpoint: "/shipping/carriers",
    title: "Courier Companies",
    subtitle: "Carriers available for shipment fulfillment",
    columns: [
      { key: "name", label: "Name" },
      { key: "trackingUrlTemplate", label: "Tracking URL" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "trackingUrlTemplate", label: "Tracking URL template", type: "text" },
    ],
  },
  {
    route: "shipping/pickup-locations",
    endpoint: "/shipping/pickup-locations",
    title: "Pickup Points",
    subtitle: "Locations customers can collect orders from",
    columns: [
      { key: "name", label: "Name" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "address", label: "Address", type: "text", required: true },
      { key: "city", label: "City", type: "text", required: true },
      { key: "country", label: "Country", type: "text", required: true },
    ],
  },

  // ---- Finance ----
  {
    route: "finance/tax-classes",
    endpoint: "/finance/tax-classes",
    title: "Tax Classes",
    subtitle: "Groupings used to apply tax rates to products",
    columns: [
      { key: "name", label: "Name" },
      { key: "isDefault", label: "Default", type: "boolean" },
    ],
    createFields: [{ key: "name", label: "Name", type: "text", required: true }],
  },
  {
    route: "finance/expenses",
    endpoint: "/finance/expenses",
    title: "Expenses",
    subtitle: "Operating expenses recorded against the business",
    columns: [
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "description", label: "Description" },
      { key: "incurredAt", label: "Incurred", type: "date" },
    ],
    createFields: [
      { key: "category", label: "Category", type: "text", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    route: "finance/accounting-entries",
    endpoint: "/finance/accounting-entries",
    title: "Accounting Entries",
    subtitle: "Double-entry ledger of debits and credits",
    columns: [
      { key: "account", label: "Account" },
      { key: "debit", label: "Debit", type: "currency" },
      { key: "credit", label: "Credit", type: "currency" },
      { key: "reference", label: "Reference" },
      { key: "postedAt", label: "Posted", type: "date" },
    ],
  },

  // ---- Purchasing ----
  {
    route: "purchasing/suppliers",
    endpoint: "/purchasing/suppliers",
    title: "Suppliers",
    subtitle: "Vendors the business purchases inventory from",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "paymentTerms", label: "Payment terms" },
      { key: "rating", label: "Rating", type: "number" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "taxNumber", label: "Tax number", type: "text" },
      { key: "paymentTerms", label: "Payment terms", type: "text" },
    ],
  },
  {
    route: "purchasing/requests",
    endpoint: "/purchasing/purchase-requests",
    title: "Purchase Requests",
    subtitle: "Internal requests to restock inventory",
    columns: [
      { key: "requestedBy", label: "Requested by" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "purchasing/rfqs",
    endpoint: "/purchasing/request-for-quotations",
    title: "Requests for Quotation",
    subtitle: "Quote requests sent out to suppliers",
    columns: [
      { key: "supplierId", label: "Supplier" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },
  {
    route: "purchasing/orders",
    endpoint: "/purchasing/purchase-orders",
    title: "Purchase Orders",
    subtitle: "Confirmed orders placed with suppliers",
    columns: [
      { key: "poNumber", label: "PO #" },
      { key: "supplierId", label: "Supplier" },
      { key: "total", label: "Total", type: "currency" },
      { key: "status", label: "Status", type: "badge" },
      { key: "expectedAt", label: "Expected", type: "date" },
    ],
  },
  {
    route: "purchasing/goods-receipts",
    endpoint: "/purchasing/goods-receipts",
    title: "Goods Receipts",
    subtitle: "Incoming stock recorded against purchase orders",
    columns: [
      { key: "purchaseOrderId", label: "Purchase order" },
      { key: "receivedAt", label: "Received", type: "date" },
      { key: "isPartial", label: "Partial", type: "boolean" },
    ],
  },
  {
    route: "purchasing/returns",
    endpoint: "/purchasing/purchase-returns",
    title: "Purchase Returns",
    subtitle: "Stock returned to suppliers",
    columns: [
      { key: "supplierId", label: "Supplier" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
  },

  // ---- Content: extra ----
  {
    route: "content/menus",
    endpoint: "/content/menus",
    title: "Menus",
    subtitle: "Navigation menus rendered on the storefront",
    columns: [
      { key: "name", label: "Name" },
      { key: "location", label: "Location" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "location", label: "Location", type: "select", options: ["header", "footer", "sidebar"] },
    ],
  },
  {
    route: "content/popups",
    endpoint: "/content/popups",
    title: "Popups",
    subtitle: "On-site popups and announcement modals",
    columns: [
      { key: "title", label: "Title" },
      { key: "trigger", label: "Trigger", type: "badge" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea" },
      { key: "trigger", label: "Trigger", type: "select", options: ["page_load", "exit_intent", "scroll", "delay"] },
    ],
  },
  {
    route: "content/blog-categories",
    endpoint: "/content/blog-categories",
    title: "Blog Categories",
    subtitle: "Categories used to organize blog posts",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
    ],
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
    ],
  },

  // ---- Support: extra ----
  {
    route: "support/complaints",
    endpoint: "/support/complaints",
    title: "Complaints",
    subtitle: "Formal complaints raised by customers",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status", type: "badge" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    detailRoute: "support/complaints",
  },
  {
    route: "support/knowledge-base",
    endpoint: "/support/knowledge-base-articles",
    title: "FAQ / Knowledge Base",
    subtitle: "Self-service help articles",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    createFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "content", label: "Content", type: "textarea" },
    ],
  },
];

export function findResourcePage(slugPath: string): ResourcePageConfig | undefined {
  return resourcePages.find((r) => r.route === slugPath);
}
