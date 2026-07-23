import { Suspense } from "react";
import { MenuPageClient } from "@/components/storefront/menu/menu-page-client";

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10" />}>
      <MenuPageClient />
    </Suspense>
  );
}
