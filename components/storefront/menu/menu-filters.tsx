"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { cn } from "@/lib/utils";
import type { DietType, SpiceLevel } from "@/types/storefront";
import { useStorefrontI18n } from "@/lib/storefront/i18n/context";

export interface MenuFilterState {
  categories: string[];
  brands: string[];
  attributes: string[];
  maxPrice: number;
  diets: DietType[];
  spiceLevels: SpiceLevel[];
  minRating: number;
  offersOnly: boolean;
}

export const defaultFilters: MenuFilterState = {
  categories: [],
  brands: [],
  attributes: [],
  maxPrice: 50,
  diets: [],
  spiceLevels: [],
  minRating: 0,
  offersOnly: false,
};

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function MenuFilters({
  filters,
  onChange,
}: {
  filters: MenuFilterState;
  onChange: (filters: MenuFilterState) => void;
}) {
  const { t, locale } = useStorefrontI18n();
  const categories = useCatalogStore((s) => s.categories);
  const brands = useCatalogStore((s) => s.brands);
  const [attributes, setAttributes] = React.useState<Array<{ id: string; name: string; values: Array<{ id: string; value: string; colorHex?: string | null }> }>>([]);

  const dietOptions: { value: DietType; label: string }[] = [
    { value: "veg", label: locale === "ar" ? "نباتي" : "Vegetarian" },
    { value: "non-veg", label: locale === "ar" ? "غير نباتي" : "Non-Vegetarian" },
    { value: "vegan", label: locale === "ar" ? "فيغان" : "Vegan" },
  ];

  const spiceOptions: { value: SpiceLevel; label: string }[] = [
    { value: "mild", label: locale === "ar" ? "خفيف" : "Mild" },
    { value: "medium", label: locale === "ar" ? "متوسط" : "Medium" },
    { value: "hot", label: locale === "ar" ? "حار" : "Hot" },
    { value: "extra-hot", label: locale === "ar" ? "حار جدًا" : "Extra Hot" },
  ];

  React.useEffect(() => {
    import("@/lib/api/client").then(({ api }) => {
      api
        .get<{ data: typeof attributes }>("/storefront/attributes")
        .then((res) => setAttributes(res.data ?? []))
        .catch(() => undefined);
    });
  }, []);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.category")}</p>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
              <Checkbox
                checked={filters.categories.includes(cat.slug)}
                onCheckedChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat.slug) })}
              />
              {cat.name}
              <span className="ms-auto text-xs text-muted-foreground">{cat.itemCount}</span>
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 ? (
        <div>
          <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.brand")}</p>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
                <Checkbox
                  checked={filters.brands.includes(brand.slug)}
                  onCheckedChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand.slug) })}
                />
                {brand.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {attributes.map((attr) => (
        <div key={attr.id}>
          <p className="mb-3 font-display text-sm font-semibold text-brown">{attr.name}</p>
          <div className="space-y-2">
            {attr.values.map((value) => (
              <label key={value.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
                <Checkbox
                  checked={filters.attributes.includes(value.value)}
                  onCheckedChange={() => onChange({ ...filters, attributes: toggle(filters.attributes, value.value) })}
                />
                {value.colorHex ? <span className="size-3 rounded-full border" style={{ background: value.colorHex }} /> : null}
                {value.value}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.priceRange")}</p>
        <input
          type="range"
          min={10}
          max={50}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "ar" ? `حتى ${filters.maxPrice} ر.س` : `Up to SAR ${filters.maxPrice}`}
        </p>
      </div>

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.dietary")}</p>
        <div className="space-y-2">
          {dietOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
              <Checkbox
                checked={filters.diets.includes(opt.value)}
                onCheckedChange={() => onChange({ ...filters, diets: toggle(filters.diets, opt.value) })}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.spiceLevel")}</p>
        <div className="flex flex-wrap gap-2">
          {spiceOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, spiceLevels: toggle(filters.spiceLevels, opt.value) })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filters.spiceLevels.includes(opt.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">{t("shop.rating")}</p>
        <div className="space-y-2">
          {[4.5, 4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
              <Checkbox
                checked={filters.minRating === r}
                onCheckedChange={(v) => onChange({ ...filters, minRating: v ? r : 0 })}
              />
              {locale === "ar" ? `${r}+ نجوم` : `${r}+ stars`}
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
        <Checkbox
          checked={filters.offersOnly}
          onCheckedChange={(v) => onChange({ ...filters, offersOnly: Boolean(v) })}
        />
        {t("shop.onOffer")}
      </label>

      <button onClick={() => onChange(defaultFilters)} className="text-sm font-semibold text-primary hover:underline">
        {t("shop.clearFilters")}
      </button>
    </div>
  );
}
