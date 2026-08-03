import Link from "next/link";
import { Button } from "../ui/button";
import { FoodImage } from "../food-image";
import { Reveal } from "../reveal";
import { cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

export function AboutTeaser({ data }: { data?: SectionCmsData } = {}) {
  const subtitle = cmsText(data, "subtitle", "Our story");
  const title = cmsText(data, "title", "Small Jar. Big Kick.");
  const body = cmsText(
    data,
    "body",
    "Halopeno began with a simple question: why is it so hard to find a pickled jalapeño that actually tastes like something? So we started pickling our own, small batches at a time, until every jar had the crunch, tang and heat we were looking for."
  );
  const body2 = cmsText(
    data,
    "body2",
    "Six signature flavors later, every jar is still made the same way. No fillers, no shortcuts, no preservatives. Just peppers doing what they do best."
  );
  const image = cmsText(data, "image", "/images/lifestyle/family-table-vine-fire.jpg");
  const imageAlt = cmsText(data, "imageAlt", "A family sharing a meal with Halopeno Vine Fire relish");
  const ctaText = cmsText(data, "ctaText", "Read Our Story");
  const ctaLink = cmsText(data, "ctaLink", "/about");
  const imagePosition = cmsText(data, "imagePosition", "left");
  const imageFirst = imagePosition !== "right";

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal className={imageFirst ? undefined : "lg:order-2"}>
          <div className="relative">
            <div className="absolute -left-5 -top-5 -z-10 size-full rounded-[38px] bg-accent/15" />
            <FoodImage
              src={image}
              alt={imageAlt}
              containerClassName="aspect-[4/3] rounded-[38px]"
              className="aspect-[4/3] rounded-[38px] object-[center_58%]"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1} className={imageFirst ? undefined : "lg:order-1"}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{subtitle}</p>
          <h2 className="font-display text-[32px] font-semibold leading-tight text-brown sm:text-[38px]">{title}</h2>
          {body ? <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{body}</p> : null}
          {body2 ? <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{body2}</p> : null}
          {ctaText ? (
            <Button variant="outline" className="mt-6" asChild>
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
