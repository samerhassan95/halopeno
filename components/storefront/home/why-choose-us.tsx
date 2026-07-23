import { Leaf, Flame, Truck, ShieldCheck, Recycle, Sparkles, Radar, Headset } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

const mainFeatures = [
  { icon: Leaf, title: "Small-Batch Made", desc: "Every jar pickled in small batches for real, consistent flavor." },
  { icon: Flame, title: "Real Heat, Real Flavor", desc: "No shortcuts or fillers. Just peppers doing what they do best." },
  { icon: Truck, title: "Fast Delivery", desc: "Fresh jars at your door across Riyadh, Jeddah and Dammam." },
  { icon: ShieldCheck, title: "Secure Payments", desc: "Encrypted checkout with every major payment method." },
];

const extraFeatures = [
  { icon: Sparkles, title: "No Preservatives" },
  { icon: Recycle, title: "Eco-Friendly Packaging" },
  { icon: Radar, title: "Live Order Tracking" },
  { icon: Headset, title: "24/7 Customer Support" },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <Reveal>
        <SectionHeading title="Made the Halopeno Way" />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {mainFeatures.map((f, index) => (
            <div
              key={f.title}
              className={cn(
                "rounded-[24px] border border-primary/10 p-6 shadow-soft",
                index === 0 && "bg-primary text-primary-foreground lg:col-span-5 lg:row-span-2 lg:p-8",
                index === 1 && "bg-accent text-accent-foreground lg:col-span-7",
                index > 1 && "bg-card",
                index === 2 && "lg:col-span-4",
                index === 3 && "lg:col-span-3"
              )}
            >
              <div className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                index < 2 ? "bg-white/12 text-inherit" : "bg-primary/10 text-primary"
              )}>
                <f.icon className="size-6" />
              </div>
              <h3 className={cn("mt-5 font-display text-xl font-bold", index < 2 ? "text-inherit" : "text-brown")}>{f.title}</h3>
              <p className={cn(
                "mt-2 max-w-sm text-sm leading-relaxed",
                index === 0 && "text-primary-foreground/75",
                index === 1 && "text-accent-foreground/75",
                index > 1 && "text-muted-foreground"
              )}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {extraFeatures.map((f) => (
            <span
              key={f.title}
              className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-brown"
            >
              <f.icon className="size-4 text-olive-dark" />
              {f.title}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
