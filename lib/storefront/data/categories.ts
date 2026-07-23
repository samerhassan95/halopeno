import type { Category } from "@/types/storefront";

export const categories: Category[] = [
  { id: "cat-flavors", name: "Pickled Flavors", slug: "flavors", image: "", itemCount: 6 },
  { id: "cat-sets", name: "Gift Sets", slug: "sets", image: "", itemCount: 1 },
];

export const categoryEmoji: Record<string, string> = {
  flavors: "🌶️",
  sets: "🎁",
};
