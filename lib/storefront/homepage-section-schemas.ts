import type { HomepageSectionType } from "@/lib/storefront/homepage-sections";

export type SectionFieldType = "text" | "textarea" | "number" | "select" | "toggle" | "color" | "image" | "video" | "date";

export interface SectionField {
  key: string;
  label: string;
  type: SectionFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

export interface SectionSchema {
  label: string;
  description: string;
  fields: SectionField[];
  defaultData: Record<string, string | number | boolean | string[]>;
}

const titleFields: SectionField[] = [
  { key: "title", label: "Section title", type: "text", required: true },
  { key: "subtitle", label: "Subtitle or description", type: "textarea" },
];

const productFields: SectionField[] = [
  ...titleFields,
  { key: "productSource", label: "Product source", type: "select", options: [{ label: "Automatic", value: "automatic" }, { label: "Manual selection", value: "manual" }, { label: "Collection", value: "collection" }] },
  { key: "sort", label: "Sorting", type: "select", options: [{ label: "Featured", value: "featured" }, { label: "Newest", value: "newest" }, { label: "Best selling", value: "best-selling" }, { label: "Price: low to high", value: "price-asc" }] },
  { key: "limit", label: "Maximum products", type: "number", min: 2, max: 24 },
  { key: "desktopColumns", label: "Desktop columns", type: "number", min: 2, max: 6 },
  { key: "mobileColumns", label: "Mobile columns", type: "number", min: 1, max: 2 },
  { key: "showPrice", label: "Show price", type: "toggle" },
  { key: "showRating", label: "Show ratings", type: "toggle" },
  { key: "showWishlist", label: "Show wishlist", type: "toggle" },
  { key: "showAddToCart", label: "Show Add to Cart", type: "toggle" },
  { key: "viewAllText", label: "View all button text", type: "text" },
  { key: "viewAllLink", label: "View all link", type: "text", placeholder: "/shop" },
];

export const SECTION_SCHEMAS: Record<HomepageSectionType, SectionSchema> = {
  hero: {
    label: "Hero slider", description: "Editorial headline, media, and calls to action.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" }, { key: "title", label: "Slide title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" }, { key: "description", label: "Description", type: "textarea" },
      { key: "primaryCta", label: "Primary CTA text", type: "text" }, { key: "primaryLink", label: "Primary CTA link", type: "text", placeholder: "/shop" },
      { key: "secondaryCta", label: "Secondary CTA text", type: "text" }, { key: "secondaryLink", label: "Secondary CTA link", type: "text" },
      { key: "desktopImage", label: "Desktop image", type: "image" }, { key: "mobileImage", label: "Mobile image", type: "image" },
      { key: "video", label: "Optional background video", type: "video" }, { key: "imageAlt", label: "Media alt text", type: "text", required: true },
      { key: "alignment", label: "Text alignment", type: "select", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
      { key: "overlay", label: "Overlay color", type: "color" }, { key: "overlayOpacity", label: "Overlay opacity", type: "number", min: 0, max: 100 },
      { key: "autoplay", label: "Autoplay slides", type: "toggle" }, { key: "duration", label: "Slide duration (seconds)", type: "number", min: 2, max: 20 },
      { key: "arrows", label: "Navigation arrows", type: "toggle" }, { key: "dots", label: "Pagination dots", type: "toggle" },
    ],
    defaultData: { eyebrow: "Fresh from our kitchen", title: "Small jar. Big kick.", subtitle: "Bold flavor for every table.", description: "Discover small-batch favorites crafted with real ingredients.", primaryCta: "Shop now", primaryLink: "/shop", secondaryCta: "Our story", secondaryLink: "/about", desktopImage: "", mobileImage: "", video: "", imageAlt: "Featured storefront collection", alignment: "left", overlay: "#000000", overlayOpacity: 24, autoplay: true, duration: 6, arrows: true, dots: true },
  },
  delivery_bar: { label: "Delivery / pickup bar", description: "A compact service announcement strip.", fields: [{ key: "message", label: "Message", type: "text", required: true }, { key: "secondaryMessage", label: "Secondary message", type: "text" }, { key: "icon", label: "Icon style", type: "select", options: [{ label: "Delivery", value: "delivery" }, { label: "Store", value: "store" }, { label: "None", value: "none" }] }, { key: "link", label: "Link", type: "text" }], defaultData: { message: "Free delivery on orders over $75", secondaryMessage: "Pickup available today", icon: "delivery", link: "/shop" } },
  signature_dishes: { label: "Signature products", description: "A curated product collection.", fields: productFields, defaultData: { title: "Signature favorites", subtitle: "The products our customers return to.", productSource: "automatic", sort: "featured", limit: 4, desktopColumns: 4, mobileColumns: 2, showPrice: true, showRating: true, showWishlist: true, showAddToCart: true, viewAllText: "View all", viewAllLink: "/shop" } },
  best_sellers: { label: "Best sellers", description: "Top-performing products from the catalog.", fields: productFields, defaultData: { title: "Best sellers", subtitle: "Most loved by our community.", productSource: "automatic", sort: "best-selling", limit: 8, desktopColumns: 4, mobileColumns: 2, showPrice: true, showRating: true, showWishlist: true, showAddToCart: true, viewAllText: "Shop best sellers", viewAllLink: "/shop" } },
  offers: { label: "Promotional offers", description: "Scheduled campaign media and messaging.", fields: [...titleFields, { key: "badge", label: "Discount badge", type: "text" }, { key: "media", label: "Promotional image", type: "image" }, { key: "mobileMedia", label: "Mobile image", type: "image" }, { key: "video", label: "Optional video", type: "video" }, { key: "ctaText", label: "CTA text", type: "text" }, { key: "ctaLink", label: "CTA link", type: "text" }, { key: "countdown", label: "Show countdown", type: "toggle" }, { key: "endDate", label: "Offer end date", type: "date" }], defaultData: { title: "A special offer", subtitle: "Limited time only.", badge: "Save 20%", media: "", mobileMedia: "", video: "", ctaText: "Shop offer", ctaLink: "/offers", countdown: true, endDate: "" } },
  why_choose_us: { label: "Why choose us", description: "Benefits and trust signals.", fields: [...titleFields, { key: "benefit1", label: "Benefit one", type: "text" }, { key: "benefit2", label: "Benefit two", type: "text" }, { key: "benefit3", label: "Benefit three", type: "text" }, { key: "benefit4", label: "Benefit four", type: "text" }], defaultData: { title: "Why customers choose us", subtitle: "Thoughtful service at every step.", benefit1: "Premium quality", benefit2: "Secure payment", benefit3: "Fast delivery", benefit4: "Easy returns" } },
  about_teaser: { label: "Image with text", description: "Editorial brand storytelling block.", fields: [...titleFields, { key: "body", label: "Body copy", type: "textarea" }, { key: "image", label: "Image", type: "image" }, { key: "imageAlt", label: "Image alt text", type: "text", required: true }, { key: "ctaText", label: "CTA text", type: "text" }, { key: "ctaLink", label: "CTA link", type: "text" }, { key: "imagePosition", label: "Image position", type: "select", options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }] }], defaultData: { title: "Our story", subtitle: "Made with purpose.", body: "Share the craft, people, and principles behind your brand.", image: "", imageAlt: "Our brand story", ctaText: "Learn more", ctaLink: "/about", imagePosition: "left" } },
  reviews: { label: "Testimonials", description: "Customer reviews and social proof.", fields: [...titleFields, { key: "customerName", label: "Customer name", type: "text" }, { key: "customerPhoto", label: "Customer photo", type: "image" }, { key: "rating", label: "Rating", type: "number", min: 1, max: 5 }, { key: "review", label: "Review text", type: "textarea", required: true }, { key: "customerRole", label: "Role or location", type: "text" }, { key: "autoplay", label: "Auto-slide", type: "toggle" }, { key: "visibleCount", label: "Testimonials displayed", type: "number", min: 1, max: 4 }], defaultData: { title: "Loved by customers", subtitle: "Real stories from our community.", customerName: "Amelia R.", customerPhoto: "", rating: 5, review: "Beautiful quality and an effortless shopping experience.", customerRole: "Verified buyer", autoplay: true, visibleCount: 3 } },
  blog_teaser: { label: "Blog posts", description: "Latest editorial content.", fields: [...titleFields, { key: "category", label: "Blog category", type: "text" }, { key: "articleCount", label: "Number of articles", type: "number", min: 1, max: 12 }, { key: "sort", label: "Sort order", type: "select", options: [{ label: "Newest first", value: "newest" }, { label: "Oldest first", value: "oldest" }, { label: "Featured", value: "featured" }] }, { key: "showDate", label: "Show date", type: "toggle" }, { key: "showAuthor", label: "Show author", type: "toggle" }, { key: "showExcerpt", label: "Show excerpt", type: "toggle" }, { key: "showImage", label: "Show image", type: "toggle" }, { key: "viewAllText", label: "View all button", type: "text" }], defaultData: { title: "From the journal", subtitle: "Ideas, guides, and stories.", category: "", articleCount: 3, sort: "newest", showDate: true, showAuthor: false, showExcerpt: true, showImage: true, viewAllText: "Read all stories" } },
};

export function sectionDefaultData(type: HomepageSectionType) {
  return { ...SECTION_SCHEMAS[type].defaultData };
}
