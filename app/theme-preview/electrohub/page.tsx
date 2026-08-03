import { CatalogLoader } from "@/components/storefront/catalog-loader";
import { ElectroHubFooter, ElectroHubHeader, ElectroHubHomepage } from "@/components/storefront/themes/electrohub";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontI18nProvider } from "@/lib/storefront/i18n/context";

export default function ElectroHubThemePreviewPage() {
  return <div className="storefront-theme min-h-screen bg-[#F5F7FB] font-sans text-[#111827] antialiased" data-active-theme="electrohub-preview">
    <style>{`.storefront-theme { --primary: #2563EB; --accent: #06B6D4; --background: #F5F7FB; --foreground: #111827; --radius: .75rem; }`}</style>
    <StorefrontI18nProvider>
      <CatalogLoader />
      <ElectroHubHeader />
      <main><ElectroHubHomepage /></main>
      <ElectroHubFooter />
      <CartDrawer />
    </StorefrontI18nProvider>
  </div>;
}
