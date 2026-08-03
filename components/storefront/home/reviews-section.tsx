"use client";

import { BadgeCheck, ThumbsUp } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { RatingStars } from "../rating-stars";
import { FoodImage } from "../food-image";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { overallRating, totalReviews } from "@/lib/storefront/data/reviews";
import { Reveal } from "../reveal";
import { cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

export function ReviewsSection({ data }: { data?: SectionCmsData } = {}) {
  const reviews = useCatalogStore((s) => s.reviews);
  const title = cmsText(data, "title", "What Our Customers Say");
  const subtitle = cmsText(
    data,
    "subtitle",
    `Rated ${overallRating} out of 5 from ${totalReviews.toLocaleString()} verified orders.`
  );
  const visibleCount = Math.max(1, cmsNumber(data, "visibleCount", 4));
  const cmsReview = cmsText(data, "review", "");
  const cmsName = cmsText(data, "customerName", "");
  const cmsRole = cmsText(data, "customerRole", "");
  const cmsPhoto = cmsText(data, "customerPhoto", "");
  const cmsRating = cmsNumber(data, "rating", 5);

  const cmsCard = cmsReview
    ? {
        id: "cms-review",
        avatar: cmsName.slice(0, 2).toUpperCase() || "CU",
        customerName: cmsName || "Customer",
        verified: true,
        rating: cmsRating,
        title: cmsRole || "Featured review",
        body: cmsReview,
        helpfulCount: 0,
        photo: cmsPhoto,
      }
    : null;

  const catalogCards = reviews.slice(0, Math.max(0, visibleCount - (cmsCard ? 1 : 0))).map((review) => ({
    ...review,
    photo: "",
  }));

  const displayReviews = cmsCard ? [cmsCard, ...catalogCards].slice(0, visibleCount) : catalogCards;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading title={title} description={subtitle} />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {displayReviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-3 rounded-[24px] border border-primary/10 bg-card p-6 shadow-soft sm:p-7"
            >
              <div className="flex items-center gap-3">
                {review.photo ? (
                  <FoodImage
                    src={review.photo}
                    alt={review.customerName}
                    containerClassName="size-10 overflow-hidden rounded-full"
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {review.avatar}
                  </span>
                )}
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold text-brown">
                    {review.customerName}
                    {review.verified && <BadgeCheck className="size-3.5 text-accent" />}
                  </p>
                  <RatingStars rating={review.rating} size={12} />
                </div>
              </div>
              <p className="font-display text-[15px] font-semibold text-brown">{review.title}</p>
              <p className="line-clamp-4 text-sm text-muted-foreground">{review.body}</p>
              <button className="mt-auto flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-primary">
                <ThumbsUp className="size-3.5" /> Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
