import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_SECTION_SETTINGS,
  type HomepageSectionSettings,
} from "@/lib/storefront/homepage-sections";
import { cn } from "@/lib/utils";

function isWithinSchedule(settings: HomepageSectionSettings) {
  const now = Date.now();
  if (settings.startDate) {
    const start = Date.parse(settings.startDate);
    if (Number.isFinite(start) && now < start) return false;
  }
  if (settings.endDate) {
    const end = Date.parse(settings.endDate);
    if (Number.isFinite(end) && now > end) return false;
  }
  return true;
}

export function SectionShell({
  settings,
  children,
  className,
}: {
  settings?: Partial<HomepageSectionSettings>;
  children: ReactNode;
  className?: string;
}) {
  const merged = { ...DEFAULT_SECTION_SETTINGS, ...settings };
  if (!isWithinSchedule(merged)) return null;

  const customBg = Boolean(merged.backgroundColor && merged.backgroundColor !== DEFAULT_SECTION_SETTINGS.backgroundColor);
  const customPadding =
    merged.paddingTop !== DEFAULT_SECTION_SETTINGS.paddingTop ||
    merged.paddingBottom !== DEFAULT_SECTION_SETTINGS.paddingBottom;

  const style: CSSProperties = {
    paddingTop: customPadding ? merged.paddingTop : undefined,
    paddingBottom: customPadding ? merged.paddingBottom : undefined,
    backgroundColor: customBg ? merged.backgroundColor : undefined,
    backgroundImage: merged.backgroundImage ? `url(${merged.backgroundImage})` : undefined,
    backgroundSize: merged.backgroundImage ? "cover" : undefined,
    backgroundPosition: "center",
    borderRadius: merged.borderRadius || undefined,
  };

  return (
    <div
      id={merged.anchorId || undefined}
      className={cn(
        "relative",
        !merged.desktopVisible && "lg:hidden",
        !merged.tabletVisible && "max-lg:hidden md:hidden",
        !merged.mobileVisible && "max-md:hidden",
        merged.cssClass,
        className
      )}
      style={style}
    >
      {merged.backgroundVideo ? (
        <video
          className="pointer-events-none absolute inset-0 -z-10 size-full object-cover"
          src={merged.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : null}
      {children}
    </div>
  );
}
