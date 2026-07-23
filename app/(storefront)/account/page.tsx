import { Suspense } from "react";
import { AccountPageClient } from "@/components/storefront/account/account-page-client";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10" />}>
      <AccountPageClient />
    </Suspense>
  );
}
