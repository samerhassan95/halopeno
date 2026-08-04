import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api/client";

async function getPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/storefront/pages/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as {
      title: string;
      content: string | null;
      metaTitle: string | null;
      metaDescription: string | null;
    } | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-brown sm:text-4xl">{page.title}</h1>
      <div
        className="prose mt-8 max-w-none text-[15px] leading-loose text-foreground/80"
        dangerouslySetInnerHTML={{
          __html: page.content
            ? page.content.includes("<")
              ? page.content
              : page.content.replace(/\n/g, "<br/>")
            : "<p>This page has no content yet.</p>",
        }}
      />
    </div>
  );
}
