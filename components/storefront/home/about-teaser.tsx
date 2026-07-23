import Link from "next/link";
import { Button } from "../ui/button";
import { FoodImage } from "../food-image";
import { Reveal } from "../reveal";

export function AboutTeaser() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="absolute -left-5 -top-5 -z-10 size-full rounded-[38px] bg-accent/15" />
            <FoodImage
              src="/images/lifestyle/family-table-vine-fire.jpg"
              alt="A family sharing a meal with Halopeno Vine Fire relish"
              containerClassName="aspect-[4/3] rounded-[38px]"
              className="aspect-[4/3] rounded-[38px] object-[center_58%]"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Our story</p>
          <h2 className="font-display text-[32px] font-semibold leading-tight text-brown sm:text-[38px]">
            Small Jar. Big Kick.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Halopeno began with a simple question: why is it so hard to find a pickled jalapeño that actually tastes
            like something? So we started pickling our own, small batches at a time, until every jar had the crunch,
            tang and heat we were looking for.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Six signature flavors later, every jar is still made the same way. No fillers, no shortcuts, no
            preservatives. Just peppers doing what they do best.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/about">Read Our Story</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
