import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      )}
      <h2 className="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-brown sm:text-[42px]">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
