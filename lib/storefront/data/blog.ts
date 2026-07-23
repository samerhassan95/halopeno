import type { BlogPost } from "@/types/storefront";

export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    slug: "the-halopeno-story",
    title: "Small Jar, Big Kick: The Halopeno Story",
    excerpt: "Why we started pickling our own jalapeños and why we'll never cut corners on flavor.",
    content:
      "Halopeno began with a simple frustration. Most pickled jalapeños on the shelf tasted flat, one-note, and nothing like the real thing. So we started pickling our own, small batches at a time, testing brines and heat levels until every jar had the crunch, tang and kick we were chasing. No fillers, no shortcuts, no preservatives. Just peppers doing what they do best. Six flavors later, that's still the whole philosophy behind every jar we make.",
    image: "/images/lifestyle/family-dinner-vine-fire.jpg",
    category: "Our Story",
    author: "Halopeno Team",
    date: "2026-06-01",
    readTime: "5 min read",
  },
  {
    id: "blog-2",
    slug: "guide-to-heat-levels",
    title: "A Guide to Choosing the Right Heat Level for You",
    excerpt: "Mild, medium, hot or extra-hot. See what each of our six flavors brings to the table.",
    content:
      "Heat tolerance is personal, and our six flavors are built to give you real choice. Citrus Kick and Tahini Twist sit on the mild end, letting the brine and add-ins shine without much burn. Zesty Crunch brings a classic medium warmth. Mustard Blaze and Vine Fire step things up for those who want a proper kick. Ruby Heat is our extra-hot flagship, a genuine challenge for real heat-seekers. Start mild, work your way up, and find your favorite.",
    image: "/images/lifestyle/ruby-heat-toast.jpg",
    category: "Guides",
    author: "Halopeno Team",
    date: "2026-05-18",
    readTime: "4 min read",
  },
  {
    id: "blog-3",
    slug: "five-ways-to-use-pickled-jalapenos",
    title: "Five Ways to Use Pickled Jalapeños Beyond the Jar",
    excerpt: "From tacos to grilled cheese, here is how to get more out of every jar of Halopeno.",
    content:
      "A jar of Halopeno is never just a topping. Chop Zesty Crunch into a quick salsa, layer Mustard Blaze onto a grilled cheese sandwich, fold Citrus Kick through a chicken salad, or blend Vine Fire into a marinade for grilled meats. Ruby Heat makes a striking garnish for cocktails and bloody marys, and Tahini Twist is unbeatable stirred into hummus. However you use it, a spoonful goes a long way.",
    image: "/images/lifestyle/zesty-crunch-grill.jpg",
    category: "Recipes",
    author: "Halopeno Team",
    date: "2026-05-02",
    readTime: "4 min read",
  },
  {
    id: "blog-4",
    slug: "how-we-pickle-in-small-batches",
    title: "How We Pickle in Small Batches and Why It Matters",
    excerpt: "Behind the scenes of how every Halopeno jar goes from fresh peppers to your table.",
    content:
      "Every batch starts with fresh jalapeños, sliced by hand and pickled low and slow in a bright vinegar brine. We work in small batches on purpose. It's slower, but it means every jar tastes the way it's supposed to, with none of the mushiness or dulled heat that comes from mass production. It's more work, but it's the only way we know how to do it.",
    image: "/images/lifestyle/citrus-kick-sandwich.jpg",
    category: "Behind the Scenes",
    author: "Halopeno Team",
    date: "2026-04-20",
    readTime: "5 min read",
  },
];

export function getPostBySlug(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
