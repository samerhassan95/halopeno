"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { cmsBool, cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

interface Slide {
  src: string;
  alt: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    src: "/images/home/banner-favorite-flavor.jpg",
    alt: "Halopeno jars with the message Find Your Favorite Flavor.",
  },
  {
    src: "/images/home/banner-elevate-every-bite.jpg",
    alt: "Halopeno jars arranged in a bright kitchen with the message Elevate Every Bite.",
  },
  {
    src: "/images/home/banner-flavor-speaks.jpg",
    alt: "A Halopeno Vine Fire jar with the message Flavor That Speaks for Itself.",
  },
];

const AUTOPLAY_DELAY = 6000;
const SWIPE_THRESHOLD = 45;

export function Hero({ data }: { data?: SectionCmsData } = {}) {
  const cmsImage = cmsText(data, "desktopImage", "");
  const cmsMobile = cmsText(data, "mobileImage", "");
  const cmsAlt = cmsText(data, "imageAlt", "Featured storefront collection");
  const slides = cmsImage
    ? [{ src: cmsImage, alt: cmsAlt }, ...(cmsMobile && cmsMobile !== cmsImage ? [{ src: cmsMobile, alt: cmsAlt }] : [])]
    : DEFAULT_SLIDES;
  const autoplay = cmsBool(data, "autoplay", true);
  const durationMs = cmsNumber(data, "duration", 6) * 1000 || AUTOPLAY_DELAY;
  const showArrows = cmsBool(data, "arrows", true);
  const showDots = cmsBool(data, "dots", true);

  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const pointerStart = React.useRef<number | null>(null);

  const previousSlide = React.useCallback(() => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = React.useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, [slides.length]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  React.useEffect(() => {
    if (!autoplay || paused || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(nextSlide, durationMs);
    return () => window.clearInterval(timer);
  }, [autoplay, durationMs, nextSlide, paused, reducedMotion, slides.length]);

  React.useEffect(() => {
    setActive(0);
  }, [cmsImage]);

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    if (distance > 0) previousSlide();
    else nextSlide();
  };

  return (
    <section
      aria-label="Featured Halopeno products"
      aria-roledescription="carousel"
      className="group relative isolate w-full overflow-hidden bg-[#173421] touch-pan-y"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") previousSlide();
        if (event.key === "ArrowRight") nextSlide();
      }}
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      <div className="relative aspect-[256/109] w-full">
        {slides.map((slide, index) => (
          <Image
            key={`${slide.src}-${index}`}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            unoptimized={slide.src.startsWith("http") || slide.src.startsWith("/uploads")}
            draggable={false}
            className={cn(
              "select-none object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
              index === active ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {active + 1} of {slides.length}: {slides[active]?.alt}
      </p>

      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={previousSlide}
            className="absolute start-5 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[#173421]/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#173421]/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ChevronLeft className="size-5 sm:size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={nextSlide}
            className="absolute end-5 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[#173421]/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#173421]/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
          >
            <ChevronRight className="size-5 sm:size-6" aria-hidden="true" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-white/25 bg-[#173421]/70 px-2 py-1 shadow-lg backdrop-blur-sm sm:bottom-4 sm:px-2.5 sm:py-1.5"
          role="group"
          aria-label="Choose a slide"
        >
          {slides.map((slide, index) => (
            <button
              key={`${slide.src}-dot-${index}`}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => setActive(index)}
              className="flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  index === active ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
