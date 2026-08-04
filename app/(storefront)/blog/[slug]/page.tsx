import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { FoodImage } from "@/components/storefront/food-image";
import { fetchStorefrontBlogPost, fetchStorefrontBlogPosts } from "@/lib/storefront/fetch-content";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    fetchStorefrontBlogPost(slug),
    fetchStorefrontBlogPosts(12),
  ]);
  if (!post) notFound();

  const more = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-primary">Blog</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{post.title}</span>
      </nav>

      <span className="text-xs font-semibold uppercase tracking-wide text-gold">{post.category}</span>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-brown sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {post.author} · {new Date(post.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} · {post.readTime}
      </p>

      <div className="mt-6 aspect-[16/9] overflow-hidden rounded-[28px]">
        <FoodImage src={post.image} alt={post.title} containerClassName="size-full" className="size-full" />
      </div>

      <div
        className="mt-8 text-[15px] leading-loose text-foreground/80 prose prose-p:my-3 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content.includes("<") ? post.content : post.content.replace(/\n/g, "<br/>") }}
      />

      {more.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-brown">More from the journal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {more.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-2xl bg-card shadow-soft">
                <div className="aspect-video overflow-hidden">
                  <FoodImage src={p.image} alt={p.title} containerClassName="size-full" className="size-full transition-transform duration-500 group-hover:scale-110" />
                </div>
                <p className="p-3 text-sm font-medium text-brown">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
