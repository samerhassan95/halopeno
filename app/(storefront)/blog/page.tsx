import Link from "next/link";
import { FoodImage } from "@/components/storefront/food-image";
import { SectionHeading } from "@/components/storefront/section-heading";
import { fetchStorefrontBlogPosts } from "@/lib/storefront/fetch-content";

export default async function BlogPage() {
  const posts = await fetchStorefrontBlogPosts();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Stories & recipes" title="From Our Kitchen Journal" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block overflow-hidden rounded-[28px] bg-card shadow-soft">
            <div className="aspect-[16/9] overflow-hidden">
              <FoodImage
                src={post.image}
                alt={post.title}
                containerClassName="size-full"
                className="size-full transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold">{post.category}</span>
              <h2 className="mt-1.5 font-display text-xl font-semibold leading-snug text-brown">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {post.author} · {post.readTime}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
