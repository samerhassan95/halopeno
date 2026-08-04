"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { cn } from "@/lib/utils";
import type { DietType, SpiceLevel } from "@/types/storefront";

export interface MenuFilterState {
  categories: string[];
  brands: string[];
  maxPrice: number;
  diets: DietType[];
  spiceLevels: SpiceLevel[];
  minRating: number;
  offersOnly: boolean;
}

export const defaultFilters: MenuFilterState = {
  categories: [],
  brands: [],
  maxPrice: 50,
  diets: [],
  spiceLevels: [],
  minRating: 0,
  offersOnly: false,
};

const dietOptions: { value: DietType; label: string }[] = [
  { value: "veg", label: "Vegetarian" },
  { value: "non-veg", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const spiceOptions: { value: SpiceLevel; label: string }[] = [
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "hot", label: "Hot" },
  { value: "extra-hot", label: "Extra Hot" },
];

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
  const categories = useCatalogStore((s) => s.categories);
  const brands = useCatalogStore((s) => s.brands);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">Category</p>
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
          <p className="mb-3 font-display text-sm font-semibold text-brown">Brand</p>
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

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">Price Range</p>
        <input
          type="range"
          min={10}
          max={50}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">Up to SAR {filters.maxPrice}</p>
      </div>

      <div>
        <p className="mb-3 font-display text-sm font-semibold text-brown">Dietary</p>
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
        <p className="mb-3 font-display text-sm font-semibold text-brown">Spice Level</p>
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
        <p className="mb-3 font-display text-sm font-semibold text-brown">Rating</p>
        <div className="space-y-2">
          {[4.5, 4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
              <Checkbox
                checked={filters.minRating === r}
                onCheckedChange={(v) => onChange({ ...filters, minRating: v ? r : 0 })}
              />
              {r}+ stars
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
        <Checkbox
          checked={filters.offersOnly}
          onCheckedChange={(v) => onChange({ ...filters, offersOnly: Boolean(v) })}
        />
        On offer only
      </label>

      <button onClick={() => onChange(defaultFilters)} className="text-sm font-semibold text-primary hover:underline">
        Clear all filters
      </button>
    </div>
  );
}
