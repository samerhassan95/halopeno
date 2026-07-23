import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { FoodImage } from "../food-image";
import { blogPosts } from "@/lib/storefront/data/blog";
import { Reveal } from "../reveal";

export function BlogTeaser() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title="From the Halopeno Journal" align="left" />
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/blog" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Visit the blog <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {blogPosts.slice(0, 3).map((post, i) => (
          <Reveal key={post.id} delay={0.08 * i}>
            <Link href={`/blog/${post.slug}`} className="group block overflow-hidden rounded-[28px] bg-card shadow-soft">
              <div className="aspect-[16/10] overflow-hidden">
                <FoodImage
                  src={post.image}
                  alt={post.title}
                  containerClassName="size-full"
                  className="size-full transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gold">{post.category}</span>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-brown">{post.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">{post.readTime}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
