"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../section-heading";
import { FoodImage } from "../food-image";
import { blogPosts as fallbackPosts } from "@/lib/storefront/data/blog";
import { Reveal } from "../reveal";
import { cmsBool, cmsNumber, cmsText, type SectionCmsData } from "@/lib/storefront/section-cms";
import { api } from "@/lib/api/client";
import type { BlogPost } from "@/types/storefront";

export function BlogTeaser({ data }: { data?: SectionCmsData } = {}) {
  const title = cmsText(data, "title", "From the Halopeno Journal");
  const subtitle = cmsText(data, "subtitle", "");
  const viewAllText = cmsText(data, "viewAllText", "Visit the blog");
  const viewAllLink = cmsText(data, "viewAllLink", "/blog");
  const category = cmsText(data, "category", "").toLowerCase();
  const articleCount = Math.max(1, cmsNumber(data, "articleCount", 3));
  const sort = cmsText(data, "sort", "newest");
  const showDate = cmsBool(data, "showDate", true);
  const showAuthor = cmsBool(data, "showAuthor", false);
  const showExcerpt = cmsBool(data, "showExcerpt", true);
  const showImage = cmsBool(data, "showImage", true);
  const [allPosts, setAllPosts] = React.useState<BlogPost[]>(fallbackPosts);

  React.useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: BlogPost[] }>("/storefront/blog-posts?limit=24")
      .then((res) => {
        if (!cancelled && res.data?.length) setAllPosts(res.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  let posts = [...allPosts];
  if (category) posts = posts.filter((post) => post.category.toLowerCase().includes(category));
  if (sort === "oldest") posts = posts.reverse();
  if (sort === "featured") posts = posts.sort((a, b) => a.title.localeCompare(b.title));
  posts = posts.slice(0, articleCount);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
        <Reveal>
          <SectionHeading title={title} description={subtitle || undefined} align="left" />
        </Reveal>
        {viewAllText ? (
          <Reveal delay={0.1}>
            <Link href={viewAllLink} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {viewAllText} <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={0.08 * i}>
            <Link href={`/blog/${post.slug}`} className="group block overflow-hidden rounded-[28px] bg-card shadow-soft">
              {showImage ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <FoodImage
                    src={post.image}
                    alt={post.title}
                    containerClassName="size-full"
                    className="size-full transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ) : null}
              <div className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gold">{post.category}</span>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-brown">{post.title}</h3>
                {showExcerpt ? <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                {(showDate || showAuthor) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {[showDate ? post.readTime : null, showAuthor ? post.author : null].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
