import { API_URL } from "@/lib/api/client";
import { getTheme, THEME_REGISTRY, type ThemeDefinition } from "@/lib/themes/registry";

export interface ActiveThemeSetting {
  id: string;
  deployedAt?: string;
  deployedBy?: string;
}

export async function getActiveTheme(): Promise<ThemeDefinition> {
  try {
    const response = await fetch(`${API_URL}/storefront/active-theme`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load active theme");
    const payload = (await response.json()) as { value?: ActiveThemeSetting };
    return getTheme(payload.value?.id || "classic") || THEME_REGISTRY[0];
  } catch {
    return THEME_REGISTRY[0];
  }
}
