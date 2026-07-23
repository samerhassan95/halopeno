"use client";

import { Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export type SortOption = "popularity" | "rating" | "price-asc" | "price-desc" | "newest";

export function MenuToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  onOpenMobileFilters,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  resultCount: number;
  onOpenMobileFilters?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="lg:hidden" onClick={onOpenMobileFilters} aria-label="Filters">
          <SlidersHorizontal className="size-4" />
        </Button>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search flavours..."
            className="h-11 rounded-full ps-11"
          />
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">{resultCount} items</p>
      </div>

      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="h-11 w-44 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden items-center gap-1 rounded-full border border-border p-1 sm:flex">
          <button
            onClick={() => onViewChange("grid")}
            className={cn("flex size-9 items-center justify-center rounded-full", view === "grid" && "bg-secondary")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn("flex size-9 items-center justify-center rounded-full", view === "list" && "bg-secondary")}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
