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
  name?: string;
  status?: "published" | "draft" | "scheduled" | "incomplete";
  data?: Record<string, string | number | boolean | string[]>;
  settings?: HomepageSectionSettings;
}

export interface HomepageSectionSettings {
  desktopVisible: boolean;
  tabletVisible: boolean;
  mobileVisible: boolean;
  width: "contained" | "full";
  maxWidth: number;
  paddingTop: number;
  paddingBottom: number;
  backgroundColor: string;
  backgroundImage: string;
  backgroundVideo: string;
  borderColor: string;
  borderRadius: number;
  anchorId: string;
  cssClass: string;
  startDate: string;
  endDate: string;
}

export const DEFAULT_SECTION_SETTINGS: HomepageSectionSettings = {
  desktopVisible: true,
  tabletVisible: true,
  mobileVisible: true,
  width: "contained",
  maxWidth: 1280,
  paddingTop: 56,
  paddingBottom: 56,
  backgroundColor: "#ffffff",
  backgroundImage: "",
  backgroundVideo: "",
  borderColor: "#e5e7eb",
  borderRadius: 0,
  anchorId: "",
  cssClass: "",
  startDate: "",
  endDate: "",
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = HOMEPAGE_SECTION_TYPES.map((s, i) => ({
  id: s.type,
  type: s.type,
  visible: true,
  order: i,
}));

export function sectionLabel(type: string): string {
  return HOMEPAGE_SECTION_TYPES.find((s) => s.type === type)?.label ?? type;
}

export function hydrateHomepageSection(section: HomepageSectionConfig): HomepageSectionConfig {
  return {
    ...section,
    name: section.name || sectionLabel(section.type),
    status: section.status || "published",
    data: section.data || {},
    settings: { ...DEFAULT_SECTION_SETTINGS, ...section.settings },
  };
}
