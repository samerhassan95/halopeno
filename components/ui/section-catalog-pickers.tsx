"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type CatalogItem = { id: string; name: string; slug: string; status?: string };

export function ProductPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    api
      .get<{ data: CatalogItem[] }>("/commerce/products?limit=100&sortBy=name&sortOrder=asc")
      .then((response) => setItems(response.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = new Set(value);
  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
  });

  function toggle(slug: string) {
    if (selected.has(slug)) onChange(value.filter((id) => id !== slug));
    else onChange([...value, slug]);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">Used when Product source is Manual selection. Stores product slugs.</p>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products…" />
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border p-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No products found</p>
        ) : (
          filtered.map((item) => {
            const active = selected.has(item.slug) || selected.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.slug)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary",
                  active && "bg-primary/10 text-primary"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded border",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                  )}
                >
                  {active ? <Check className="size-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <span className="truncate text-xs text-muted-foreground">{item.slug}</span>
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-muted-foreground">{value.length} selected</p>
    </div>
  );
}

export function CollectionPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<{ data: CatalogItem[] }>("/commerce/collections?limit=100&sortBy=name&sortOrder=asc")
      .then((response) => setItems(response.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">Used when Product source is Collection.</p>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading collections…
        </div>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">
          <button
            type="button"
            onClick={() => onChange("")}
            className={cn("w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary", !value && "bg-primary/10 text-primary")}
          >
            None
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.slug)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary",
                value === item.slug && "bg-primary/10 text-primary"
              )}
            >
              <span className="truncate font-medium">{item.name}</span>
              <span className="truncate text-xs text-muted-foreground">{item.slug}</span>
            </button>
          ))}
          {!items.length ? <p className="py-4 text-center text-sm text-muted-foreground">No collections yet</p> : null}
        </div>
      )}
    </div>
  );
}
