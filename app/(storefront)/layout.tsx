import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CatalogLoader } from "@/components/storefront/catalog-loader";
import { StorefrontI18nProvider } from "@/lib/storefront/i18n/context";
import { API_URL } from "@/lib/api/client";
import type { GlobalStylesConfig } from "@/lib/storefront/global-styles";
import { getActiveTheme } from "@/lib/storefront/active-theme";
import { ElectroHubFooter, ElectroHubHeader } from "@/components/storefront/themes/electrohub";

export const metadata: Metadata = {
  title: "Halopeno | Small Jar. Big Kick.",
  description:
    "Small-batch pickled jalapeño flavors, crafted for real heat and real flavor. Shop Zesty Crunch, Mustard Blaze, Ruby Heat and more from Halopeno.",
};

async function getGlobalStyleOverrides(): Promise<Partial<GlobalStylesConfig> | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/global-styles`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.value as Partial<GlobalStylesConfig>) ?? null;
  } catch {
    return null;
  }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [overrides, activeTheme] = await Promise.all([getGlobalStyleOverrides(), getActiveTheme()]);
  const isElectroHub = activeTheme.id === "electrohub";

  return (
    <div
      className="storefront-theme min-h-screen bg-background font-sans text-foreground antialiased"
      data-active-theme={activeTheme.id}
    >
      {(overrides || isElectroHub) && (
        <style>{`
          .storefront-theme {
            ${isElectroHub ? `--primary: #2563EB; --accent: #06B6D4; --background: #F5F7FB; --foreground: #111827; --radius: 0.75rem;` : ""}
            ${overrides?.primary ? `--primary: ${overrides.primary};` : ""}
            ${overrides?.accent ? `--accent: ${overrides.accent}; --destructive: ${overrides.accent};` : ""}
            ${overrides?.background ? `--background: ${overrides.background};` : ""}
            ${overrides?.radius ? `--radius: ${overrides.radius};` : ""}
          }
        `}</style>
      )}
      <StorefrontI18nProvider>
        <CatalogLoader />
        {isElectroHub ? <ElectroHubHeader /> : <StorefrontHeader />}
        <main className="pb-20 md:pb-0">{children}</main>
        {isElectroHub ? <ElectroHubFooter /> : <StorefrontFooter />}
        <CartDrawer />
        <MobileBottomNav />
      </StorefrontI18nProvider>
    </div>
  );
}
