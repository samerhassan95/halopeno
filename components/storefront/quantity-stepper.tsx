import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  qty,
  onChange,
  size = "default",
  className,
}: {
  qty: number;
  onChange: (qty: number) => void;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-foreground/10 bg-white",
        size === "sm" ? "h-8" : "h-10",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, qty - 1))}
        className={cn(
          "flex items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground",
          size === "sm" ? "size-8" : "size-10"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-[1.75rem] text-center font-semibold tabular-nums", size === "sm" ? "text-sm" : "text-[15px]")}>
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        className={cn(
          "flex items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground",
          size === "sm" ? "size-8" : "size-10"
        )}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
