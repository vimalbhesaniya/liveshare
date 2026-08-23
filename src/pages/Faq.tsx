import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";
import type { ReactNode } from "react";

function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  return (
    <div className="border border-border/70 rounded-xl p-5 bg-card/20">
      <h3 className="font-semibold mb-2">{q}</h3>
      <div className="text-muted-foreground leading-relaxed">{a}</div>
    </div>
  );
}

export default function Faq() {
  usePageSeo({
    title: "FAQ | LiveShare",
    description:
      "Common questions about LiveShare — free or not, account need, session time, languages, and code storage.",
    canonicalPath: "/faq",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">FAQ</h1>

        <div className="grid gap-4 max-w-4xl">
          <FAQItem
            q="Is it really free?"
            a={
              <>
                Yes. LiveShare is free so you can paste code and start working
                together right away — no signup need.
              </>
            }
          />

          <FAQItem
            q="Do I need account?"
            a={
              <>
                No. You can make room and share link without account. If you
                want privacy for one room, you can set password for that
                session only.
              </>
            }
          />

          <FAQItem
            q="What is edit link and view-only link?"
            a={
              <>
                Edit link is like{" "}
                <code className="text-xs">liveshare.dev/abc123</code> — people
                can type and change code. View-only link is like{" "}
                <code className="text-xs">liveshare.dev/r/abc123</code> — they
                can see live updates but cannot edit. Use Share button to copy
                both. If room has password, viewer also need password to open,
                then still stay read-only.
              </>
            }
          />

          <FAQItem
            q="How long shared sessions last?"
            a={
              <>
                Shared session stay open through its room link. Code content is
                stored in backend so other people can open link and continue
                working together later also.
              </>
            }
          />

          <FAQItem
            q="What languages are supported?"
            a={
              <>
                LiveShare use Monaco editor with syntax highlighting for many
                languages. You will find support for JavaScript/TypeScript,
                Python, Java, C/C++, C#, Go, Rust, PHP, Ruby, HTML/CSS and
                more.
              </>
            }
          />

          <FAQItem
            q="Is my code stored? Is it secure?"
            a={
              <>
                When you make room, LiveShare store code so it can load and
                sync when both edit live. If room has password, backend need
                correct password before code can open. Still, do not share
                sensitive secrets you do not want others to see.
              </>
            }
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
