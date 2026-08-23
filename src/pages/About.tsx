import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";

const ABOUT_TEXT = `
LiveShare is made because one problem comes again and again for developers. Someone need help with code but setting up same environment takes too much time.

If you send GitHub link then also friend has to install many things, open editor, copy paste, and sometimes still code not running same. If you do screen share then other person only watching, they cannot type or change code. LiveShare solve this. You open browser, paste your code, get one link and share. Both can edit together in real time. No signup, no download.

We make LiveShare mainly for:
1) Pair programming when two people coding together in job or project.
2) Interview when company want to see candidate coding live.
3) Teacher and student when explaining programming — better than only PPT slides.

Our idea is simple — fast sharing and easy to use. You can come back same room with same link. If you want privacy you can put password also. It work on mobile and computer both, you don't need very costly laptop.

This website is free for everyone. We try to keep it useful so people can learn, debug and share code without tension.

If you are developer, student, teacher or anyone who share code, LiveShare is for you. This is why we built it and we will keep making it better.
`;

export default function About() {
  usePageSeo({
    title: "About LiveShare | Free Real-Time Code Editor",
    description:
      "About LiveShare — free real-time code editor for pair programming, interview and teaching. No signup need.",
    canonicalPath: "/about",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          About LiveShare
        </h1>
        <div className="prose prose-slate max-w-3xl whitespace-pre-wrap">
          {ABOUT_TEXT}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

