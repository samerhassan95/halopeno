"use client";

import { BadgeCheck, ThumbsUp } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { RatingStars } from "../rating-stars";
import { useCatalogStore } from "@/lib/storefront/store/catalog-store";
import { overallRating, totalReviews } from "@/lib/storefront/data/reviews";
import { Reveal } from "../reveal";

export function ReviewsSection() {
  const reviews = useCatalogStore((s) => s.reviews);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading
          title="What Our Customers Say"
          description={`Rated ${overallRating} out of 5 from ${totalReviews.toLocaleString()} verified orders.`}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {reviews.slice(0, 4).map((review) => (
            <div key={review.id} className="flex flex-col gap-3 rounded-[24px] border border-primary/10 bg-card p-6 shadow-soft sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {review.avatar}
                </span>
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
