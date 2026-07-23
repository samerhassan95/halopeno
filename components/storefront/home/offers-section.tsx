import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { OfferCard } from "../offer-card";
import { offers } from "@/lib/storefront/data/offers";
import { Reveal } from "../reveal";

export function OffersSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title="Special Offers" align="left" />
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/offers" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See all offers <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {offers.slice(0, 4).map((offer, i) => (
          <Reveal key={offer.id} delay={0.06 * i}>
            <OfferCard offer={offer} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
