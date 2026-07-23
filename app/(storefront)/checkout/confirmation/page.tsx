import { Suspense } from "react";
import { ConfirmationClient } from "@/components/storefront/checkout/confirmation-client";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-20 sm:px-6" />}>
      <ConfirmationClient />
    </Suspense>
  );
}
