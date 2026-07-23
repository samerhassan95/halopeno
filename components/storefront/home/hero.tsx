"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  src: string;
  alt: string;
}

const slides: Slide[] = [
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

export function Hero() {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const pointerStart = React.useRef<number | null>(null);

  const previousSlide = React.useCallback(() => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  }, []);

  const nextSlide = React.useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  React.useEffect(() => {
    if (paused || reducedMotion) return;

    const timer = window.setInterval(nextSlide, AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [nextSlide, paused, reducedMotion]);

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
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            draggable={false}
            className={cn(
              "select-none object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
              index === active ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {active + 1} of {slides.length}: {slides[active].alt}
      </p>

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

      <div
        className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-white/25 bg-[#173421]/70 px-2 py-1 shadow-lg backdrop-blur-sm sm:bottom-4 sm:px-2.5 sm:py-1.5"
        role="group"
        aria-label="Choose a slide"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.src}
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
    </section>
  );
}
