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
    slug: "debug-code-together-online",
    title: "How to Debug Code Together Online (No Setup)",
    date: "2026-08-23",
    excerpt:
      "Code break and you send screenshot? That not enough. Paste code, share link, fix bug together live. No install need.",
  },
  {
    slug: "pair-programming-interview-tools",
    title: "Best Free Tools for Pair Programming Interviews",
    date: "2026-08-03",
    excerpt:
      "Interview take time in setup mostly. Here simple free tools so both people can code live without tension.",
  },
  {
    slug: "remote-coding-interview-step-by-step",
    title: "How to Run Remote Coding Interview (Step by Step)",
    date: "2026-08-03",
    excerpt:
      "Remote interview not only screen share. This is easy steps for interviewer and candidate to code together.",
  },
  {
    slug: "live-editor-vs-screen-sharing",
    title: "Live Editor vs Screen Sharing — Why It Matters",
    date: "2026-08-03",
    excerpt:
      "Screen share mean other person only watching. Live editor both can type — so work become faster.",
  },
];

export default function Blog() {
  usePageSeo({
    title: "Blog | LiveShare",
    description:
      "Simple guides for pair programming, remote interview and teaching with live shared editor.",
    canonicalPath: "/blog",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Blog</h1>
        <p className="text-muted-foreground max-w-3xl mb-8">
          Short writing to help you do interview better, work together more, and
          teach coding with less setup problem.
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
