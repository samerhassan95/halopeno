export const HOMEPAGE_SECTION_TYPES = [
  { type: "hero", label: "Hero slider" },
  { type: "delivery_bar", label: "Delivery / pickup bar" },
  { type: "signature_dishes", label: "Signature flavors (featured products)" },
  { type: "best_sellers", label: "Best sellers" },
  { type: "offers", label: "Promotional offers" },
  { type: "why_choose_us", label: "Why choose us" },
  { type: "about_teaser", label: "About teaser" },
  { type: "reviews", label: "Testimonials" },
  { type: "blog_teaser", label: "Blog posts" },
] as const;

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number]["type"];

export interface HomepageSectionConfig {
  id: string;
  type: HomepageSectionType;
  visible: boolean;
  order: number;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = HOMEPAGE_SECTION_TYPES.map((s, i) => ({
  id: s.type,
  type: s.type,
  visible: true,
  order: i,
}));

export function sectionLabel(type: string): string {
  return HOMEPAGE_SECTION_TYPES.find((s) => s.type === type)?.label ?? type;
}
