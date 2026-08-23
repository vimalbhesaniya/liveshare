import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";

const POSTS: Array<{
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}> = [
  {
    slug: "pair-programming-interview-tools",
    title: "Best Free Tools for Pair Programming Interviews",
    date: "2026-08-03",
    excerpt:
      "Simple list of free tools for live coding interview — less setup, no paywall, no big download.",
  },
  {
    slug: "remote-coding-interview-step-by-step",
    title: "How to Run Remote Coding Interview (Step by Step)",
    date: "2026-08-03",
    excerpt:
      "Easy process for interviewer and candidate — setup before call, live editing, feedback and next steps.",
  },
  {
    slug: "live-editor-vs-screen-sharing",
    title: "Live Editor vs Screen Sharing — Why It Matters",
    date: "2026-08-03",
    excerpt:
      "Screen share is mostly watching. Live editor let both sides work on code — faster and clearer.",
  },
];

export default function Blog() {
  usePageSeo({
    title: "Blog | LiveShare",
    description:
      "Guides for pair programming, remote coding interview and teaching with real-time shared editor.",
    canonicalPath: "/blog",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Blog</h1>
        <p className="text-muted-foreground max-w-3xl mb-8">
          Short guides to help you run better interview, work together more and
          teach programming with less setup tension.
        </p>

        <div className="grid gap-4 max-w-4xl">
          {POSTS.map((p) => (
            <article
              key={p.slug}
              className="border border-border/70 rounded-xl p-5 bg-card/20"
            >
              <div className="text-sm text-muted-foreground mb-2">{p.date}</div>
              <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {p.excerpt}
              </p>
              <Link
                to={`/blog/${p.slug}`}
                className="text-primary underline hover:text-primary/90"
              >
                Read more
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
