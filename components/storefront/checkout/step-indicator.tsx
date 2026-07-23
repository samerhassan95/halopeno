import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex shrink-0 items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done ? "bg-accent text-accent-foreground" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" /> : step}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-brown" : "text-muted-foreground")}>{label}</span>
            </div>
            {step < steps.length && <span className="mx-2 h-px w-6 bg-border sm:w-10" />}
          </div>
        );
      })}
    </div>
  );
}
