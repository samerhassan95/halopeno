"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";

export function CatalogLoader() {
  const fetchCatalog = useCatalogStore((s) => s.fetchCatalog);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return null;
}
