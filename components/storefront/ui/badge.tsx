import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        discount: "bg-accent text-accent-foreground",
        bestseller: "bg-foreground text-background",
        new: "bg-primary text-primary-foreground",
        outline: "border border-foreground/15 text-foreground bg-card/70 backdrop-blur",
        soft: "bg-secondary text-foreground",
        success: "bg-success/15 text-success",
        destructive: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: { variant: "soft" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function DietMark({ diet, className }: { diet: "veg" | "non-veg" | "vegan"; className?: string }) {
  const color = diet === "non-veg" ? "border-[#B5442D] [&>span]:bg-[#B5442D]" : "border-[#3F7D3A] [&>span]:bg-[#3F7D3A]";
  return (
    <span
      className={cn("inline-flex size-4 shrink-0 items-center justify-center border", color, className)}
      title={diet === "non-veg" ? "Non-vegetarian" : diet === "vegan" ? "Vegan" : "Vegetarian"}
    >
      <span className="size-2 rounded-full" />
    </span>
  );
}

export { Badge, badgeVariants };
