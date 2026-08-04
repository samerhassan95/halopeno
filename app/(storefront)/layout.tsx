import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CatalogLoader } from "@/components/storefront/catalog-loader";
import { CommerceConfigLoader } from "@/components/storefront/commerce-config-loader";
import { MaintenanceGate } from "@/components/storefront/maintenance-gate";
import { StorefrontPopupHost } from "@/components/storefront/popup-host";
import { LiveChatWidget } from "@/components/storefront/live-chat-widget";
import { AbandonedCartSync } from "@/components/storefront/abandoned-cart-sync";
import { AffiliateTracker } from "@/components/storefront/affiliate-tracker";
import { Suspense } from "react";
import { StorefrontI18nProvider } from "@/lib/storefront/i18n/context";
import { CustomerAuthProvider } from "@/lib/storefront/customer-auth";
import { API_URL } from "@/lib/api/client";
import { buildStorefrontStyleVars, type GlobalStylesConfig } from "@/lib/storefront/global-styles";
import { getActiveTheme } from "@/lib/storefront/active-theme";
import {
  fetchFooterConfig,
  fetchHeaderConfig,
  fetchStorefrontMenu,
} from "@/lib/storefront/fetch-content";
import type { StorefrontHeaderConfig } from "@/components/storefront/header";
import type { StorefrontFooterConfig } from "@/components/storefront/footer";

const DEFAULT_METADATA = {
  title: "Halopeno | Small Jar. Big Kick.",
  description:
    "Small-batch pickled jalapeño flavors, crafted for real heat and real flavor. Shop Zesty Crunch, Mustard Blaze, Ruby Heat and more from Halopeno.",
} as const;

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

async function getSiteMeta(): Promise<{ title?: string; description?: string } | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/site-settings`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const value = json.value as { metaTitle?: string; metaDescription?: string; siteName?: string; tagline?: string };
    return {
      title: value.metaTitle || (value.siteName ? `${value.siteName}${value.tagline ? ` | ${value.tagline}` : ""}` : undefined),
      description: value.metaDescription || undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteMeta();
  return {
    title: site?.title || DEFAULT_METADATA.title,
    description: site?.description || DEFAULT_METADATA.description,
  };
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [overrides, activeTheme, headerConfig, footerConfig, headerMenu, footerMenu] = await Promise.all([
    getGlobalStyleOverrides(),
    getActiveTheme(),
    fetchHeaderConfig<StorefrontHeaderConfig>({}),
    fetchFooterConfig<StorefrontFooterConfig>({}),
    fetchStorefrontMenu("header", []),
    fetchStorefrontMenu("footer", []),
  ]);
  const isElectroHub = activeTheme.id === "electrohub";
  const styleVars = [
    isElectroHub
      ? `--primary: #2563EB; --accent: #06B6D4; --background: #F5F7FB; --foreground: #111827; --radius: 0.75rem;`
      : "",
    buildStorefrontStyleVars(overrides),
  ]
    .filter(Boolean)
    .join("\n            ");

  return (
    <div
      className="storefront-theme min-h-screen bg-background font-sans text-foreground antialiased"
      data-active-theme={activeTheme.id}
    >
      {(styleVars || overrides?.customCss) && (
        <style>{`
          .storefront-theme {
            ${styleVars}
          }
          ${overrides?.customCss ?? ""}
        `}</style>
      )}
      <StorefrontI18nProvider>
        <CustomerAuthProvider>
        <CatalogLoader />
        <CommerceConfigLoader />
        <StorefrontHeader navLinks={headerMenu.length ? headerMenu : undefined} config={headerConfig} />
        <main className="pb-20 md:pb-0">
          <MaintenanceGate>{children}</MaintenanceGate>
        </main>
        <StorefrontFooter menuLinks={footerMenu.length ? footerMenu : undefined} config={footerConfig} />
        <CartDrawer />
        <MobileBottomNav />
        <StorefrontPopupHost />
        <LiveChatWidget />
        <AbandonedCartSync />
        <Suspense fallback={null}><AffiliateTracker /></Suspense>
        </CustomerAuthProvider>
      </StorefrontI18nProvider>
    </div>
  );
}
