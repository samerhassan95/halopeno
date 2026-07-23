// Single source of truth for which Prisma models get a generated CRUD module,
// which nav group / route prefix they live under, and their Swagger tag.
// Models NOT listed here are considered infra (User, RefreshToken) or pure
// join tables (RolePermission) and are handled by hand-written modules instead.

export interface ResourceDef {
  model: string; // Prisma model name, PascalCase
  group: string; // route prefix / folder grouping
  tag: string; // Swagger tag (human readable group label)
}

export const resourceManifest: ResourceDef[] = [
  // Administration
  { model: 'Company', group: 'administration', tag: 'Administration' },
  { model: 'Store', group: 'administration', tag: 'Administration' },
  { model: 'Role', group: 'administration', tag: 'Administration' },
  { model: 'Permission', group: 'administration', tag: 'Administration' },
  { model: 'User', group: 'administration', tag: 'Administration' },
  { model: 'ActivityLog', group: 'administration', tag: 'Administration' },
  { model: 'Language', group: 'administration', tag: 'Administration' },
  { model: 'Currency', group: 'administration', tag: 'Administration' },

  // Settings
  { model: 'Setting', group: 'settings', tag: 'Settings' },

  // Commerce (Products & Catalog)
  { model: 'Category', group: 'commerce', tag: 'Commerce' },
  { model: 'Brand', group: 'commerce', tag: 'Commerce' },
  { model: 'Attribute', group: 'commerce', tag: 'Commerce' },
  { model: 'AttributeValue', group: 'commerce', tag: 'Commerce' },
  { model: 'Collection', group: 'commerce', tag: 'Commerce' },
  { model: 'Product', group: 'commerce', tag: 'Commerce' },
  { model: 'ProductImage', group: 'commerce', tag: 'Commerce' },
  { model: 'ProductVariant', group: 'commerce', tag: 'Commerce' },
  { model: 'AuctionDetail', group: 'commerce', tag: 'Commerce' },
  { model: 'Bid', group: 'commerce', tag: 'Commerce' },
  { model: 'PreorderDetail', group: 'commerce', tag: 'Commerce' },
  { model: 'Review', group: 'commerce', tag: 'Commerce' },
  { model: 'ProductQuestion', group: 'commerce', tag: 'Commerce' },

  // Inventory & Warehouses
  { model: 'Warehouse', group: 'inventory', tag: 'Inventory' },
  { model: 'StockItem', group: 'inventory', tag: 'Inventory' },
  { model: 'StockTransfer', group: 'inventory', tag: 'Inventory' },
  { model: 'StockAdjustment', group: 'inventory', tag: 'Inventory' },
  { model: 'StockCount', group: 'inventory', tag: 'Inventory' },
  { model: 'ProductBatch', group: 'inventory', tag: 'Inventory' },

  // Marketplace / Sellers
  { model: 'Seller', group: 'marketplace', tag: 'Marketplace' },
  { model: 'Commission', group: 'marketplace', tag: 'Marketplace' },
  { model: 'Payout', group: 'marketplace', tag: 'Marketplace' },

  // Customers
  { model: 'CustomerGroup', group: 'customers', tag: 'Customers' },
  { model: 'Customer', group: 'customers', tag: 'Customers' },
  { model: 'CustomerAddress', group: 'customers', tag: 'Customers' },
  { model: 'LoyaltyTransaction', group: 'customers', tag: 'Customers' },

  // Sales / Orders
  { model: 'Order', group: 'sales', tag: 'Sales' },
  { model: 'OrderItem', group: 'sales', tag: 'Sales' },
  { model: 'Payment', group: 'sales', tag: 'Sales' },
  { model: 'Transaction', group: 'sales', tag: 'Sales' },
  { model: 'Invoice', group: 'sales', tag: 'Sales' },
  { model: 'Return', group: 'sales', tag: 'Sales' },
  { model: 'Refund', group: 'sales', tag: 'Sales' },
  { model: 'AbandonedCart', group: 'sales', tag: 'Sales' },

  // Shipping & Delivery
  { model: 'ShippingZone', group: 'shipping', tag: 'Shipping' },
  { model: 'ShippingRate', group: 'shipping', tag: 'Shipping' },
  { model: 'Carrier', group: 'shipping', tag: 'Shipping' },
  { model: 'PickupLocation', group: 'shipping', tag: 'Shipping' },
  { model: 'DeliveryAgent', group: 'shipping', tag: 'Shipping' },
  { model: 'Shipment', group: 'shipping', tag: 'Shipping' },

  // Marketing & Promotions
  { model: 'Coupon', group: 'marketing', tag: 'Marketing' },
  { model: 'Promotion', group: 'marketing', tag: 'Marketing' },
  { model: 'FlashDeal', group: 'marketing', tag: 'Marketing' },
  { model: 'EmailCampaign', group: 'marketing', tag: 'Marketing' },
  { model: 'SmsCampaign', group: 'marketing', tag: 'Marketing' },
  { model: 'PushCampaign', group: 'marketing', tag: 'Marketing' },
  { model: 'Campaign', group: 'marketing', tag: 'Marketing' },
  { model: 'Affiliate', group: 'marketing', tag: 'Marketing' },
  { model: 'AffiliateReferral', group: 'marketing', tag: 'Marketing' },

  // Purchasing & Suppliers
  { model: 'Supplier', group: 'purchasing', tag: 'Purchasing' },
  { model: 'PurchaseRequest', group: 'purchasing', tag: 'Purchasing' },
  { model: 'RequestForQuotation', group: 'purchasing', tag: 'Purchasing' },
  { model: 'PurchaseOrder', group: 'purchasing', tag: 'Purchasing' },
  { model: 'PurchaseOrderItem', group: 'purchasing', tag: 'Purchasing' },
  { model: 'GoodsReceipt', group: 'purchasing', tag: 'Purchasing' },
  { model: 'PurchaseReturn', group: 'purchasing', tag: 'Purchasing' },

  // Finance, Tax & Accounting
  { model: 'TaxClass', group: 'finance', tag: 'Finance' },
  { model: 'TaxRate', group: 'finance', tag: 'Finance' },
  { model: 'Expense', group: 'finance', tag: 'Finance' },
  { model: 'SellerSettlement', group: 'finance', tag: 'Finance' },
  { model: 'AccountingEntry', group: 'finance', tag: 'Finance' },

  // Content & Design
  { model: 'Page', group: 'content', tag: 'Content' },
  { model: 'BlogCategory', group: 'content', tag: 'Content' },
  { model: 'BlogPost', group: 'content', tag: 'Content' },
  { model: 'Menu', group: 'content', tag: 'Content' },
  { model: 'Banner', group: 'content', tag: 'Content' },
  { model: 'Popup', group: 'content', tag: 'Content' },
  { model: 'MediaFile', group: 'content', tag: 'Content' },

  // Support & Communication
  { model: 'SupportTicket', group: 'support', tag: 'Support' },
  { model: 'TicketReply', group: 'support', tag: 'Support' },
  { model: 'ContactMessage', group: 'support', tag: 'Support' },
  { model: 'Complaint', group: 'support', tag: 'Support' },
  { model: 'KnowledgeBaseArticle', group: 'support', tag: 'Support' },

  // Notifications
  { model: 'Notification', group: 'notifications', tag: 'Notifications' },
  { model: 'NotificationTemplate', group: 'notifications', tag: 'Notifications' },

  // Integrations & API
  { model: 'ApiKey', group: 'integrations', tag: 'Integrations' },
  { model: 'Webhook', group: 'integrations', tag: 'Integrations' },
  { model: 'WebhookLog', group: 'integrations', tag: 'Integrations' },
  { model: 'IntegrationConnection', group: 'integrations', tag: 'Integrations' },
  { model: 'OtpRequest', group: 'integrations', tag: 'Integrations' },

  // AI Studio
  { model: 'AiGenerationLog', group: 'ai-studio', tag: 'AI Studio' },

  // Analytics
  { model: 'SavedReport', group: 'analytics', tag: 'Analytics' },
];
