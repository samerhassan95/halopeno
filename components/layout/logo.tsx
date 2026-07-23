import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="url(#vantage-grad)" />
      <path
        d="M9 10.5L16 21.5L23 10.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="9.5" r="2" fill="white" />
      <defs>
        <linearGradient id="vantage-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9061F9" />
          <stop offset="1" stopColor="#149BFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-bold tracking-tight text-[17px]", className)}>
      Vantage
    </span>
  );
}
