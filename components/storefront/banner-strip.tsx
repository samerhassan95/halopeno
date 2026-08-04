"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { FoodImage } from "@/components/storefront/food-image";
import { Button } from "@/components/storefront/ui/button";

interface BannerRow {
  id: string;
  title: string;
  image: string;
  link: string | null;
  placement: string;
}

export function StorefrontBannerStrip({ placement = "homepage" }: { placement?: string }) {
  const [banners, setBanners] = React.useState<BannerRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: BannerRow[] }>(`/storefront/banners?placement=${encodeURIComponent(placement)}`)
      .then((res) => {
        if (!cancelled) setBanners(res.data ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!banners.length) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
      <div className="grid gap-4 md:grid-cols-2">
        {banners.slice(0, 4).map((banner) => {
          const content = (
            <div className="group relative overflow-hidden rounded-[28px] bg-card shadow-soft">
              <div className="aspect-[21/9]">
                <FoodImage
                  src={banner.image}
                  alt={banner.title}
                  containerClassName="size-full"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 to-transparent p-5">
                <div>
                  <p className="font-display text-xl font-semibold text-white">{banner.title}</p>
                  {banner.link ? (
                    <Button size="sm" variant="olive" className="mt-3 rounded-full">
                      Shop now
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
          return banner.link ? (
            <Link key={banner.id} href={banner.link}>
              {content}
            </Link>
          ) : (
            <div key={banner.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
