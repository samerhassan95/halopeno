import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { OfferCard } from "../offer-card";
import { FoodImage } from "../food-image";
import { Button } from "../ui/button";
import { offers } from "@/lib/storefront/data/offers";
import { Reveal } from "../reveal";
import { cmsBool, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

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
