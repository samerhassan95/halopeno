import type { ComponentType } from "react";
import { Hero } from "@/components/storefront/home/hero";
import { DeliveryBar } from "@/components/storefront/home/delivery-bar";
import { SignatureDishes } from "@/components/storefront/home/signature-dishes";
import { BestSellers } from "@/components/storefront/home/best-sellers";
import { OffersSection } from "@/components/storefront/home/offers-section";
import { WhyChooseUs } from "@/components/storefront/home/why-choose-us";
import { AboutTeaser } from "@/components/storefront/home/about-teaser";
import { ReviewsSection } from "@/components/storefront/home/reviews-section";
import { BlogTeaser } from "@/components/storefront/home/blog-teaser";
import { API_URL } from "@/lib/api/client";
import { DEFAULT_HOMEPAGE_SECTIONS, type HomepageSectionConfig } from "@/lib/storefront/homepage-sections";
import { getActiveTheme } from "@/lib/storefront/active-theme";
import { ElectroHubHomepage } from "@/components/storefront/themes/electrohub";
import type { SectionCmsData } from "@/lib/storefront/section-cms";

type SectionComponent = ComponentType<{ data?: SectionCmsData }>;

const COMPONENT_MAP: Record<string, SectionComponent> = {
  hero: Hero,
  delivery_bar: DeliveryBar,
  signature_dishes: SignatureDishes,
  best_sellers: BestSellers,
  offers: OffersSection,
  why_choose_us: WhyChooseUs,
  about_teaser: AboutTeaser,
  reviews: ReviewsSection,
  blog_teaser: BlogTeaser,
};

async function getHomepageSections(): Promise<HomepageSectionConfig[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/homepage-sections`, { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const json = await res.json();
    const value = json.value as HomepageSectionConfig[] | null;
    if (!value?.length) return DEFAULT_HOMEPAGE_SECTIONS;
    return value;
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS;
  }
}

export default async function StorefrontHomePage() {
  const [sections, activeTheme] = await Promise.all([getHomepageSections(), getActiveTheme()]);
  if (activeTheme.id === "electrohub") return <ElectroHubHomepage />;
  const ordered = [...sections].filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <>
      {ordered.map((s) => {
        const Component = COMPONENT_MAP[s.type];
        return Component ? <Component key={s.id} data={s.data} /> : null;
      })}
    </>
  );
}
