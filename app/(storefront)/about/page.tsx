import { FoodImage } from "@/components/storefront/food-image";
import { SectionHeading } from "@/components/storefront/section-heading";
import { Leaf, Flame, ShieldCheck, Sparkles } from "lucide-react";

const values = [
  { icon: Leaf, title: "Ingredient Sourcing", desc: "Fresh jalapeños and produce sourced directly for freshness and consistent quality." },
  { icon: Flame, title: "Small-Batch Pickling", desc: "Every jar is pickled low and slow in small batches, never mass-produced." },
  { icon: ShieldCheck, title: "No Preservatives", desc: "No fillers, no shortcuts, no artificial preservatives. Just peppers and brine." },
  { icon: Sparkles, title: "Quality Standards", desc: "Every batch is taste-tested for crunch, tang and heat before it reaches your jar." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Our story</p>
          <h1 className="font-display text-[36px] font-semibold leading-tight text-brown sm:text-[44px]">
            Small Jar. Big Kick.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            Halopeno began with a simple frustration. Most pickled jalapeños on the shelf tasted flat, one-note, and
            nothing like the real thing. So we started pickling our own, small batches at a time, testing brines and
            heat levels until every jar had the crunch, tang and kick we were chasing.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Today we make six signature flavors and a gift set, but every jar still goes through the same
            small-batch process. No fillers, no shortcuts, no preservatives. Just peppers doing what they do best.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -right-5 -top-5 -z-10 size-full rounded-[38px] bg-primary/10" />
          <FoodImage
            src="/images/lifestyle/family-dinner-vine-fire.jpg"
            alt="A family enjoying Halopeno Vine Fire relish around the dinner table"
            containerClassName="aspect-[4/3] rounded-[38px]"
            className="aspect-[4/3] rounded-[38px] object-[center_54%]"
          />
        </div>
      </div>

      <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <FoodImage
            src="/images/lifestyle/citrus-kick-breakfast.jpg"
            alt="Halopeno Citrus Kick relish being served with warm bread and breakfast dishes"
            containerClassName="aspect-[4/3] rounded-[38px]"
            className="aspect-[4/3] rounded-[38px] object-[center_58%]"
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Made to share</p>
          <h2 className="font-display text-[30px] font-semibold leading-tight text-brown sm:text-[34px]">
            A Place at Every Table
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            From a quick breakfast to a long family dinner, Halopeno is made for the meals people gather around.
            Each flavor brings its own bright, bold character, so one spoonful can turn an everyday plate into
            something worth sharing.
          </p>
        </div>
      </div>

      <div className="mt-20">
        <SectionHeading eyebrow="What we stand for" title="Our Values" />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-[28px] bg-card p-6 text-center shadow-soft">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-olive-dark">
                <v.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-brown">{v.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
