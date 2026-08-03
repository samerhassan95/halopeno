import { Leaf, Flame, Truck, ShieldCheck, Recycle, Sparkles, Radar, Headset } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";
import { cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";

const MAIN_ICONS = [Leaf, Flame, Truck, ShieldCheck] as const;
const EXTRA_ICONS = [Sparkles, Recycle, Radar, Headset] as const;

const DEFAULT_MAIN = [
  { title: "Small-Batch Made", desc: "Every jar pickled in small batches for real, consistent flavor." },
  { title: "Real Heat, Real Flavor", desc: "No shortcuts or fillers. Just peppers doing what they do best." },
  { title: "Fast Delivery", desc: "Fresh jars at your door across Riyadh, Jeddah and Dammam." },
  { title: "Secure Payments", desc: "Encrypted checkout with every major payment method." },
];

const DEFAULT_EXTRA = ["No Preservatives", "Eco-Friendly Packaging", "Live Order Tracking", "24/7 Customer Support"];

export function WhyChooseUs({ data }: { data?: SectionCmsData } = {}) {
  const title = cmsText(data, "title", "Made the Halopeno Way");
  const subtitle = cmsText(data, "subtitle", "");
  const mainFeatures = DEFAULT_MAIN.map((feature, index) => ({
    icon: MAIN_ICONS[index],
    title: cmsText(data, `benefit${index + 1}`, feature.title),
    desc: feature.desc,
  }));
  const extraFeatures = DEFAULT_EXTRA.map((label, index) => ({
    icon: EXTRA_ICONS[index],
    title: label,
  }));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading title={title} description={subtitle || undefined} />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {mainFeatures.map((f, index) => (
            <div
              key={`${f.title}-${index}`}
              className={cn(
                "rounded-[24px] border border-primary/10 p-6 shadow-soft",
                index === 0 && "bg-primary text-primary-foreground lg:col-span-5 lg:row-span-2 lg:p-8",
                index === 1 && "bg-accent text-accent-foreground lg:col-span-7",
                index > 1 && "bg-card",
                index === 2 && "lg:col-span-4",
                index === 3 && "lg:col-span-3"
              )}
            >
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl",
                  index < 2 ? "bg-white/12 text-inherit" : "bg-primary/10 text-primary"
                )}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className={cn("mt-5 font-display text-xl font-bold", index < 2 ? "text-inherit" : "text-brown")}>
                {f.title}
              </h3>
              <p
                className={cn(
                  "mt-2 max-w-sm text-sm leading-relaxed",
                  index === 0 && "text-primary-foreground/75",
                  index === 1 && "text-accent-foreground/75",
                  index > 1 && "text-muted-foreground"
                )}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {extraFeatures.map((f) => (
            <div
              key={f.title}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-card px-4 py-2 text-sm font-medium text-brown shadow-soft"
            >
              <f.icon className="size-4 text-primary" />
              {f.title}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
