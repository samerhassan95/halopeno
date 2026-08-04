import { FoodImage } from "@/components/storefront/food-image";
import { SectionHeading } from "@/components/storefront/section-heading";
import { Leaf, Flame, ShieldCheck, Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api/client";

const values = [
  { icon: Leaf, title: "Ingredient Sourcing", desc: "Fresh jalapeños and produce sourced directly for freshness and consistent quality." },
  { icon: Flame, title: "Small-Batch Pickling", desc: "Every jar is pickled low and slow in small batches, never mass-produced." },
  { icon: ShieldCheck, title: "No Preservatives", desc: "No fillers, no shortcuts, no artificial preservatives. Just peppers and brine." },
  { icon: Sparkles, title: "Quality Standards", desc: "Every batch is taste-tested for crunch, tang and heat before it reaches your jar." },
];

async function getAboutPage() {
  try {
    const res = await fetch(`${API_URL}/storefront/pages/about`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as { title: string; content: string | null } | null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const cms = await getAboutPage();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Our story</p>
          <h1 className="font-display text-[36px] font-semibold leading-tight text-brown sm:text-[44px]">
            {cms?.title || "Small Jar. Big Kick."}
          </h1>
          {cms?.content ? (
            <div
              className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: cms.content.includes("<") ? cms.content : cms.content.replace(/\n/g, "<br/>"),
              }}
            />
          ) : (
            <>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                Halopeno began with a simple frustration. Most pickled jalapeños on the shelf tasted flat, one-note, and
                nothing like the real thing. So we started pickling our own, small batches at a time, testing brines and
                heat levels until every jar had the crunch, tang and kick we were chasing.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Today we make six signature flavors and a gift set, but every jar still goes through the same
                small-batch process. No fillers, no shortcuts, no preservatives. Just peppers doing what they do best.
              </p>
            </>
          )}
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

      <div className="mt-16">
        <SectionHeading title="What We Stand For" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <div key={value.title} className="rounded-[28px] bg-card p-6 shadow-soft">
              <value.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold text-brown">{value.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
