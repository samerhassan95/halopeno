import { API_URL } from "@/lib/api/client";
import { SectionHeading } from "@/components/storefront/section-heading";

async function getFaq() {
  try {
    const res = await fetch(`${API_URL}/storefront/faq`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as Array<{ id: string; title: string; content: string | null; category: string | null }>;
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const articles = await getFaq();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading eyebrow="Help center" title="Frequently Asked Questions" />
      <div className="mt-10 space-y-4">
        {articles.length ? (
          articles.map((article) => (
            <details key={article.id} className="rounded-[24px] bg-card p-5 shadow-soft">
              <summary className="cursor-pointer font-display text-lg font-semibold text-brown">
                {article.title}
              </summary>
              {article.content ? (
                <div
                  className="mt-3 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: article.content.includes("<")
                      ? article.content
                      : article.content.replace(/\n/g, "<br/>"),
                  }}
                />
              ) : null}
            </details>
          ))
        ) : (
          <p className="rounded-[24px] bg-card p-6 text-sm text-muted-foreground shadow-soft">
            FAQ articles will appear here once published from the admin knowledge base.
          </p>
        )}
      </div>
    </div>
  );
}
