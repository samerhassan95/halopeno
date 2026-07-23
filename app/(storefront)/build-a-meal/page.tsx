"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Utensils, Drumstick, Salad, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { SectionHeading } from "@/components/storefront/section-heading";
import { useCartStore } from "@/lib/storefront/store/cart-store";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/storefront/format";
import { toast } from "sonner";

const mealTypes = [
  { id: "biryani", label: "Biryani", emoji: "🍛", base: 12 },
  { id: "curry", label: "Curry", emoji: "🍲", base: 11 },
  { id: "rice-bowl", label: "Rice Bowl", emoji: "🍚", base: 10 },
  { id: "grill-platter", label: "Grill Platter", emoji: "🍢", base: 14 },
];

const proteins = [
  { id: "chicken", label: "Chicken", delta: 0 },
  { id: "mutton", label: "Mutton", delta: 3 },
  { id: "paneer", label: "Paneer", delta: 1 },
  { id: "vegetables", label: "Vegetables", delta: -1 },
];

const sizes = [
  { id: "regular", label: "Regular", delta: 0 },
  { id: "large", label: "Large", delta: 4 },
  { id: "family", label: "Family", delta: 9 },
];

const spiceLevels = [
  { id: "mild", label: "Mild" },
  { id: "medium", label: "Medium" },
  { id: "hot", label: "Hot" },
  { id: "extra-hot", label: "Extra Hot" },
];

const extras = [
  { id: "raita", label: "Raita", price: 1.5 },
  { id: "salad", label: "Salad", price: 1 },
  { id: "extra-sauce", label: "Extra Sauce", price: 0.75 },
  { id: "boiled-egg", label: "Boiled Egg", price: 1 },
  { id: "papadum", label: "Papadum", price: 1.25 },
];

const steps = ["Meal Type", "Protein", "Size", "Spice", "Extras"];

export default function BuildAMealPage() {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [step, setStep] = React.useState(1);
  const [mealType, setMealType] = React.useState(mealTypes[0].id);
  const [protein, setProtein] = React.useState(proteins[0].id);
  const [size, setSize] = React.useState(sizes[0].id);
  const [spice, setSpice] = React.useState("medium");
  const [selectedExtras, setSelectedExtras] = React.useState<string[]>([]);

  const meal = mealTypes.find((m) => m.id === mealType)!;
  const proteinObj = proteins.find((p) => p.id === protein)!;
  const sizeObj = sizes.find((s) => s.id === size)!;
  const extrasTotal = extras.filter((e) => selectedExtras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const price = meal.base + proteinObj.delta + sizeObj.delta + extrasTotal;

  function toggleExtra(id: string) {
    setSelectedExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  function handleAddToCart() {
    addItem({
      productId: `custom-${mealType}-${protein}`,
      slug: "build-a-meal",
      name: `Custom ${proteinObj.label} ${meal.label}`,
      image: "",
      unitPrice: meal.base + proteinObj.delta + sizeObj.delta,
      basePrice: meal.base,
      variationId: size,
      variationLabel: sizeObj.label,
      spiceLevel: spice as "mild" | "medium" | "hot" | "extra-hot",
      addons: extras.filter((e) => selectedExtras.includes(e.id)),
      qty: 1,
    });
    toast.success("Your custom meal was added to the cart!");
    router.push("/cart");
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Made your way" title="Build Your Own Meal" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[28px] bg-card p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  step === i + 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-brown">
                <Utensils className="size-5 text-primary" /> Choose meal type
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {mealTypes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMealType(m.id)}
                    className={cn(
                      "rounded-2xl border p-5 text-center transition-colors",
                      mealType === m.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <p className="mt-2 font-medium text-brown">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{formatSAR(m.base)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-brown">
                <Drumstick className="size-5 text-primary" /> Choose your protein
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {proteins.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProtein(p.id)}
                    className={cn(
                      "rounded-2xl border p-5 text-center transition-colors",
                      protein === p.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="font-medium text-brown">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.delta >= 0 ? `+${formatSAR(p.delta)}` : formatSAR(p.delta)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-brown">
                <Salad className="size-5 text-primary" /> Choose your size
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={cn(
                      "rounded-2xl border p-5 text-center transition-colors",
                      size === s.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="font-medium text-brown">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.delta > 0 ? `+${formatSAR(s.delta)}` : "Included"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-brown">
                <Flame className="size-5 text-primary" /> Choose spice level
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {spiceLevels.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSpice(s.id)}
                    className={cn(
                      "rounded-2xl border p-5 text-center transition-colors",
                      spice === s.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="font-medium text-brown">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-brown">
                <Sparkles className="size-5 text-primary" /> Extras & sauces
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {extras.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => toggleExtra(e.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-center transition-colors",
                      selectedExtras.includes(e.id) ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="text-sm font-medium text-brown">{e.label}</p>
                    <p className="text-xs text-muted-foreground">+{formatSAR(e.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < steps.length ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleAddToCart}>
                Add to Cart · {formatSAR(price)}
              </Button>
            )}
          </div>
        </div>

        <div className="h-fit space-y-4 rounded-[28px] bg-card p-6 shadow-soft lg:sticky lg:top-28">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-beige text-6xl">
            {meal.emoji}
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-display text-lg font-semibold text-brown">
              {proteinObj.label} {meal.label}
            </p>
            <p className="text-muted-foreground">{sizeObj.label} · {spice} spice</p>
            {selectedExtras.length > 0 && (
              <p className="text-muted-foreground">+ {extras.filter((e) => selectedExtras.includes(e.id)).map((e) => e.label).join(", ")}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
            <div>
              <p className="font-semibold text-brown">~520</p>
              <p className="text-muted-foreground">kcal</p>
            </div>
            <div>
              <p className="font-semibold text-brown">28g</p>
              <p className="text-muted-foreground">protein</p>
            </div>
            <div>
              <p className="font-semibold text-brown">60g</p>
              <p className="text-muted-foreground">carbs</p>
            </div>
          </div>
          <div className="border-t border-border pt-3 text-right font-display text-2xl font-bold text-brown">
            {formatSAR(price)}
          </div>
        </div>
      </div>
    </div>
  );
}
