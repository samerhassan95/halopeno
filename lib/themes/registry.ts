export type ThemeStatus = "published" | "draft" | "archived";

export interface ThemeDefinition {
  id: string;
  name: string;
  brand: string;
  version: string;
  status: ThemeStatus;
  updatedAt: string;
  updatedBy: string;
  type: "Custom" | "Marketplace" | "System";
  active: boolean;
  compatible: boolean;
  store: string;
  performance: number;
  installs?: string;
  colors: [string, string, string];
  category: string;
  direction: "ltr" | "rtl" | "both";
  locales: string[];
  previewImage?: string;
  previewPath?: string;
  capabilities: ThemeCapabilities;
}

export interface ThemeCapabilities {
  responsiveImages: boolean;
  lazyLoading: boolean;
  localFonts: boolean;
  reducedMotion: boolean;
  semanticMarkup: boolean;
  rtl: boolean;
  accessibleControls: boolean;
  optimizedBundles: boolean;
}

export function calculateThemePerformance(capabilities: ThemeCapabilities): number {
  const weights: Record<keyof ThemeCapabilities, number> = {
    responsiveImages: 18,
    lazyLoading: 15,
    localFonts: 10,
    reducedMotion: 8,
    semanticMarkup: 14,
    rtl: 8,
    accessibleControls: 12,
    optimizedBundles: 15,
  };
  return (Object.keys(weights) as (keyof ThemeCapabilities)[]).reduce(
    (score, key) => score + (capabilities[key] ? weights[key] : 0),
    0,
  );
}

const fullCapabilities: ThemeCapabilities = {
  responsiveImages: true,
  lazyLoading: true,
  localFonts: true,
  reducedMotion: true,
  semanticMarkup: true,
  rtl: true,
  accessibleControls: true,
  optimizedBundles: true,
};

function registeredTheme(
  theme: Omit<ThemeDefinition, "performance" | "capabilities"> & {
    capabilities?: Partial<ThemeCapabilities>;
  },
): ThemeDefinition {
  const capabilities = { ...fullCapabilities, ...theme.capabilities };
  return { ...theme, capabilities, performance: calculateThemePerformance(capabilities) };
}

export const THEME_REGISTRY: ThemeDefinition[] = [
  registeredTheme({ id: "classic", name: "Halopeno Classic", brand: "Halopeno", version: "v4.8.2", status: "published", updatedAt: "2026-08-02T14:42:00.000Z", updatedBy: "Sarah Kim", type: "Custom", active: true, compatible: true, store: "Main Store", colors: ["#5b21b6", "#a78bfa", "#f5f3ff"], category: "Food & Beverage", direction: "ltr", locales: ["en"] }),
  registeredTheme({ id: "dark-harvest", name: "Dark Harvest", brand: "Halopeno", version: "v2.3.0", status: "draft", updatedAt: "2026-07-31T09:20:00.000Z", updatedBy: "Sarah Kim", type: "Custom", active: false, compatible: true, store: "Main Store", colors: ["#111827", "#334155", "#f59e0b"], category: "Food & Beverage", direction: "ltr", locales: ["en"], capabilities: { rtl: false } }),
  registeredTheme({ id: "minimal-jar", name: "Minimal Jar", brand: "Halopeno", version: "v1.9.4", status: "archived", updatedAt: "2026-07-12T16:10:00.000Z", updatedBy: "Marcus Lee", type: "Marketplace", active: false, compatible: false, store: "Outlet", colors: ["#fafafa", "#d4d4d8", "#18181b"], category: "Editorial", direction: "ltr", locales: ["en"], installs: "8.4k", capabilities: { rtl: false, reducedMotion: false } }),
  registeredTheme({ id: "atelier", name: "Atelier Commerce", brand: "Atelier", version: "v3.1.1", status: "published", updatedAt: "2026-08-01T09:18:00.000Z", updatedBy: "Maya Stone", type: "Marketplace", active: false, compatible: true, store: "EU Store", colors: ["#0f766e", "#5eead4", "#f0fdfa"], category: "Fashion", direction: "both", locales: ["en", "fr", "ar"], installs: "12.8k" }),
  registeredTheme({ id: "launchpad", name: "Launchpad", brand: "Vantage", version: "v0.8.6", status: "draft", updatedAt: "2026-07-29T11:40:00.000Z", updatedBy: "Daniel Wu", type: "System", active: false, compatible: true, store: "Main Store", colors: ["#be123c", "#fb7185", "#fff1f2"], category: "General Commerce", direction: "both", locales: ["en", "ar"] }),
  registeredTheme({
    id: "abraaq",
    name: "Abraaq",
    brand: "Abraaq",
    version: "v1.0",
    status: "draft",
    updatedAt: "2026-08-02T17:28:00.000Z",
    updatedBy: "Sarah Kim",
    type: "Custom",
    active: false,
    compatible: true,
    store: "Main Store",
    colors: ["#17130F", "#B99558", "#F7F2E9"],
    category: "Perfume / Fragrance / Luxury Beauty",
    direction: "both",
    locales: ["ar", "en"],
    previewImage: "/themes/abraaq/hero.png",
    previewPath: "/theme-preview/abraaq",
  }),
  registeredTheme({
    id: "electrohub",
    name: "ElectroHub",
    brand: "ElectroHub",
    version: "v1.0",
    status: "draft",
    updatedAt: "2026-08-02T17:55:00.000Z",
    updatedBy: "Sarah Kim",
    type: "Custom",
    active: false,
    compatible: true,
    store: "Main Store",
    colors: ["#2563EB", "#06B6D4", "#F5F7FB"],
    category: "Electronics and Technology",
    direction: "both",
    locales: ["en", "ar"],
    previewPath: "/theme-preview/electrohub",
  }),
];

export function getTheme(id: string): ThemeDefinition | undefined {
  return THEME_REGISTRY.find((theme) => theme.id === id);
}
