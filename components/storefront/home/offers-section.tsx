"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { OfferCard } from "../offer-card";
import { FoodImage } from "../food-image";
import { Button } from "../ui/button";
import { offers as fallbackOffers } from "@/lib/storefront/data/offers";
import { Reveal } from "../reveal";
import { cmsBool, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";
import { api } from "@/lib/api/client";
import type { Offer } from "@/types/storefront";

const COLORS: Offer["color"][] = ["orange", "olive", "brown"];

export function OffersSection({ data }: { data?: SectionCmsData } = {}) {
  const title = cmsText(data, "title", "Special Offers");
  const subtitle = cmsText(data, "subtitle", "");
  const badge = cmsText(data, "badge", "");
  const media = cmsText(data, "media", "");
  const mobileMedia = cmsText(data, "mobileMedia", "");
  const video = cmsText(data, "video", "");
  const ctaText = cmsText(data, "ctaText", "See all offers");
  const ctaLink = cmsText(data, "ctaLink", "/offers");
  const endDate = cmsText(data, "endDate", "");
  const showCountdown = cmsBool(data, "countdown", false);
  const hasCmsPromo = Boolean(
    media ||
      video ||
      badge ||
      subtitle ||
      endDate ||
      (typeof data?.title === "string" && data.title.trim()) ||
      (typeof data?.ctaText === "string" && data.ctaText.trim())
  );
  const [offers, setOffers] = React.useState<Offer[]>(fallbackOffers);

  React.useEffect(() => {
    if (hasCmsPromo) return;
    let cancelled = false;
    (async () => {
      try {
        const [promoRes, couponRes] = await Promise.all([
          api.get<{ data: Array<{ id: string; name: string; type: string; discountValue: string | number | null; endsAt: string | null }> }>(
            "/storefront/promotions"
          ),
          api.get<{ data: Array<{ id: string; code: string; discountType: string; discountValue: number; expiresAt: string | null }> }>(
            "/storefront/coupons"
          ),
        ]);
        const fromPromotions: Offer[] = (promoRes.data ?? []).map((promo, index) => {
          const value = promo.discountValue == null ? null : Number(promo.discountValue);
          return {
            id: promo.id,
            title: promo.name,
            description: "Active promotion from the admin marketing center.",
            image: "",
            discountLabel:
              value == null
                ? promo.type.toUpperCase()
                : promo.type.toLowerCase().includes("percent")
                  ? `${value}% OFF`
                  : `SAR ${value} OFF`,
            code: promo.type.replace(/\s+/g, "").toUpperCase().slice(0, 12),
            expiresAt: promo.endsAt ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            color: COLORS[index % COLORS.length],
          };
        });
        const fromCoupons: Offer[] = (couponRes.data ?? []).map((coupon, index) => ({
          id: coupon.id,
          title: `Coupon ${coupon.code}`,
          description: "Use this code at checkout to unlock your discount.",
          image: "",
          discountLabel:
            coupon.discountType === "PERCENTAGE"
              ? `${coupon.discountValue}% OFF`
              : coupon.discountType === "FREE_SHIPPING"
                ? "FREE DELIVERY"
                : `SAR ${coupon.discountValue} OFF`,
          code: coupon.code,
          expiresAt: coupon.expiresAt
            ? coupon.expiresAt.slice(0, 10)
            : new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          color: COLORS[(index + 1) % COLORS.length],
        }));
        const merged = [...fromPromotions, ...fromCoupons];
        if (!cancelled && merged.length) setOffers(merged);
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasCmsPromo]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title={title} description={subtitle || undefined} align="left" />
        </Reveal>
        <Reveal delay={0.1}>
          <Link href={ctaLink} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {ctaText} <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>

      {hasCmsPromo ? (
        <Reveal delay={0.08}>
          <div className="mt-10 overflow-hidden rounded-[28px] border border-primary/10 bg-card shadow-soft lg:grid lg:grid-cols-2">
            <div className="relative aspect-[16/10] bg-secondary/40 lg:aspect-auto lg:min-h-[320px]">
              {video ? (
                <video className="absolute inset-0 size-full object-cover" src={video} autoPlay muted loop playsInline />
              ) : media ? (
                <>
                  <FoodImage
                    src={media}
                    alt={title}
                    containerClassName="absolute inset-0 size-full"
                    className={cnMobile(mobileMedia)}
                  />
                  {mobileMedia ? (
                    <FoodImage
                      src={mobileMedia}
                      alt={title}
                      containerClassName="absolute inset-0 size-full md:hidden"
                      className="size-full object-cover"
                    />
                  ) : null}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <span className="font-display text-4xl font-bold text-primary/40">{badge || title}</span>
                </div>
              )}
              {badge ? (
                <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
              {subtitle ? <p className="text-sm font-medium text-gold">{subtitle}</p> : null}
              <h3 className="font-display text-3xl font-bold text-brown">{title}</h3>
              {showCountdown && endDate ? (
                <p className="text-sm text-muted-foreground">Ends {new Date(endDate).toLocaleString()}</p>
              ) : null}
              <Button asChild className="w-fit rounded-full">
                <Link href={ctaLink}>{ctaText}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {offers.slice(0, 4).map((offer, i) => (
            <Reveal key={offer.id} delay={0.06 * i}>
              <OfferCard offer={offer} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function cnMobile(mobileMedia: string) {
  return mobileMedia ? "size-full object-cover max-md:hidden" : "size-full object-cover";
}
