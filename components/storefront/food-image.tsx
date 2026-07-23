"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FoodImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  emoji?: string;
  containerClassName?: string;
}

const GRADIENTS = [
  "from-[#e5ebd8] to-[#7d966b]",
  "from-[#f0e7d4] to-[#c58d2e]",
  "from-[#b52a24] to-[#6f1713]",
  "from-[#365f40] to-[#173c28]",
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function FoodImage({ src, alt, emoji = "🌶️", className, containerClassName, ...props }: FoodImageProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br text-5xl",
          gradientFor(String(alt ?? src ?? "food")),
          containerClassName,
          className
        )}
        aria-label={alt}
        role="img"
      >
        <span className="drop-shadow-sm">{emoji}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
