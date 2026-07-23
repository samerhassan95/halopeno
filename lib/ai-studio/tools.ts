export const AI_TOOLS = [
  { type: "product_description", label: "Product description generator", description: "Write compelling product copy from a few keywords" },
  { type: "seo_title", label: "SEO title generator", description: "Search-optimized page and product titles" },
  { type: "seo_description", label: "SEO description generator", description: "Meta descriptions that improve click-through" },
  { type: "banner_copy", label: "Banner copy generator", description: "Short, punchy copy for promotional banners" },
  { type: "blog_post", label: "Blog generator", description: "Draft full blog posts from a topic" },
  { type: "email_content", label: "Email content generator", description: "Subject lines and body copy for campaigns" },
  { type: "push_notification", label: "Push notification generator", description: "Short push copy that drives opens" },
  { type: "alt_text", label: "Image alt-text generator", description: "Accessible, descriptive alt text" },
  { type: "translation", label: "Translation assistant", description: "Translate content between languages" },
  { type: "categorization", label: "Product categorization assistant", description: "Suggest the best category for a product" },
  { type: "tag_generator", label: "Product tag generator", description: "Generate searchable product tags" },
  { type: "review_summary", label: "Review summarizer", description: "Summarize customer reviews into key themes" },
] as const;

export type AiToolType = (typeof AI_TOOLS)[number]["type"];

export function toolLabel(type: string): string {
  return AI_TOOLS.find((t) => t.type === type)?.label ?? type;
}
