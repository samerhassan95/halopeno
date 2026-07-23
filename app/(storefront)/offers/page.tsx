import { SectionHeading } from "@/components/storefront/section-heading";
import { OfferCard } from "@/components/storefront/offer-card";
import { offers } from "@/lib/storefront/data/offers";

export default function OffersPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Deals worth ordering for" title="Special Offers" align="left" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
