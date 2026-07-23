import Link from "next/link";
import { FoodImage } from "./food-image";
import { categoryEmoji } from "@/lib/storefront/data/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/storefront";

export function CategoryCard({ category, active }: { category: Category; active?: boolean }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group flex shrink-0 flex-col items-center gap-3 text-center"
    >
      <div
        className={cn(
          "relative size-24 overflow-hidden rounded-full ring-4 ring-offset-2 ring-offset-background transition-all sm:size-28",
          active ? "ring-primary" : "ring-transparent group-hover:ring-secondary"
        )}
      >
        <FoodImage
          src={category.image}
          alt={category.name}
          emoji={categoryEmoji[category.slug]}
          containerClassName="size-full"
          className="size-full transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-brown sm:text-base">{category.name}</p>
        <p className="text-xs text-muted-foreground">{category.itemCount} items</p>
      </div>
    </Link>
  );
}
