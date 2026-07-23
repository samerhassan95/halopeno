export interface GenerateInput {
  contentType: string;
  topic: string;
  tone: string;
  language: string;
  audience: string;
  keywords: string;
  length: "short" | "medium" | "long";
}

const TEMPLATES: Record<string, (i: GenerateInput) => string> = {
  product_description: (i) =>
    `Introducing ${i.topic || "our newest jar"} — a ${i.tone} take crafted for ${i.audience || "flavor lovers"}. ${i.keywords ? `Featuring ${i.keywords}. ` : ""}Small-batch made, bold in every bite.`,
  seo_title: (i) => `${i.topic || "Product"} | ${i.keywords || "Bold Flavor, Small Batch"} — Halopeno`,
  seo_description: (i) =>
    `Discover ${i.topic || "our flavors"} at Halopeno. ${i.keywords ? `${i.keywords}. ` : ""}Shop small-batch pickled jalapeños made for real heat and real flavor.`,
  banner_copy: (i) => `${i.topic || "New Flavor"} Just Dropped 🌶️ — ${i.tone === "urgent" ? "Limited time only." : "Try it today."}`,
  blog_post: (i) =>
    `# ${i.topic || "Untitled post"}\n\nWhen it comes to ${i.topic || "flavor"}, ${i.audience || "our customers"} expect nothing but the best. ${i.keywords ? `This post covers ${i.keywords}.` : ""}\n\n(Full ${i.length} draft continues here…)`,
  email_content: (i) => `Subject: ${i.topic || "Something new is brewing"}\n\nHi there — ${i.tone} news: ${i.keywords || "we've got something special for you"}.`,
  push_notification: (i) => `${i.topic || "New drop"} 🌶️ ${i.keywords ? `— ${i.keywords}` : "Tap to see what's new."}`,
  alt_text: (i) => `${i.topic || "Product photo"} showing ${i.keywords || "the jar and its ingredients"} in a ${i.tone} setting.`,
  translation: (i) => `[${i.language.toUpperCase()} translation of: "${i.topic}"]`,
  categorization: (i) => `Suggested category for "${i.topic}": ${i.keywords || "Flavors"} (confidence: high)`,
  tag_generator: (i) => (i.keywords || i.topic || "spicy, small-batch, jalapeño").split(/,\s*/).join(", "),
  review_summary: (i) => `Customers describe ${i.topic || "this product"} as ${i.tone}. Common themes: ${i.keywords || "flavor, crunch, value"}.`,
};

export function mockGenerate(input: GenerateInput): string {
  const fn = TEMPLATES[input.contentType] ?? TEMPLATES.product_description;
  return fn(input);
}

export function mockShorten(text: string): string {
  const words = text.split(/\s+/);
  return words.slice(0, Math.max(6, Math.floor(words.length * 0.6))).join(" ") + (words.length > 6 ? "…" : "");
}

export function mockExpand(text: string): string {
  return `${text} With every jar crafted in small batches, you get consistent flavor, real ingredients, and a kick that keeps you coming back.`;
}

export function mockTranslate(text: string, language: string): string {
  return language === "ar" ? `[ترجمة عربية] ${text}` : `[English translation] ${text}`;
}
