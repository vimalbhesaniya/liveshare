import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";

const POSTS: Record<
  string,
  {
    title: string;
    date: string;
    content: string;
  }
> = {
  "pair-programming-interview-tools": {
    title: "Best Free Tools for Pair Programming Interviews",
    date: "2026-08-03",
    content: `
Pair programming interview is stressful for candidate and take time for interviewer also. Main reason is setup time eat the actual coding time. Good tools remove this problem so both can focus on problem only.

Below is simple checklist for free (or no-signup) tools for live coding interview, plus how you can use them today.

What you want in interview editor
1) Zero onboarding
Candidate should not need account, download or environment setup to start coding. Simple share link is best.

2) Live editing together
Interview work best when both see edits immediately. If only one person can type, other person only watching — not good shared reasoning.

3) Language support for your tasks
Look for syntax highlighting for languages you interview in — JavaScript/TypeScript, Python, Java, C/C++ and more.

4) Clear security controls
Even in practice mode, some teams want password on room. Optional access control help keep interview private.

5) Good reset experience
Many times candidate start again. Tool should handle refresh and reload cleanly with same room link.

Where LiveShare fit
LiveShare is made for fast interview sessions:
- No signup need.
- Unique room link you share right away.
- Real-time editing in browser — candidate no need install anything.
- Optional password for private interview.

How to use these tools (quick workflow)
Step 1: Before call
Prepare short problem and starter template. Decide what you check — correctness, communication, edge cases.

Step 2: On call
Open editor room and ask candidate to paste problem template. Confirm language selection.

Step 3: During coding
Work in small steps: implement → test → explain. Ask candidate to speak assumptions and trade-offs.

Step 4: Wrap up
Summarize approach, ask one reflection question (“What you improve if more time?”), and tell next steps.

Bottom line
Free tools can still work well if they have live editing, less friction and easy re-entry. LiveShare workflow (paste code → share link → work together) is built for exactly this.
`,
  },
  "remote-coding-interview-step-by-step": {
    title: "How to Run Remote Coding Interview (Step by Step)",
    date: "2026-08-03",
    content: `
Remote coding interview work best when you treat it like guided work together, not only “screen share event.”

Here is step-by-step process you can use for most technical interviews.

1) Pick format and language early
Confirm language and scope. If task is algorithm type, mention expected complexity. If product type, clarify input/output examples.

2) Share room link (not repository)
Candidate should start coding in seconds. Sharing GitHub repo often cause delay — install, build error, dependency mismatch.

Instead:
- Create shared room.
- Paste starter code (or clear blank template).
- Share unique link.

3) Set expectations about working together
Tell candidate how you will work:
- Both read and edit same code.
- You ask “why” questions, not only “what.”
- You use shared editor for examples and test cases.

4) Guide first milestone
First 5–10 minutes should show progress:
- Confirm problem is understood.
- Implement simplest working solution.
- Add one test case.

5) Iterate with short cycles
Use small loops:
implement → run → explain → refine.

Short cycles reduce confusion and keep candidate in thinking mode.

6) Evaluate communication and correctness together
Good candidate explain trade-offs. Strong solution show edge-case awareness.

If candidate get stuck:
- Ask for assumptions.
- Tell them to write plan first.
- Break task into smaller steps.

7) Close with reflection question
When time is almost over, ask:
“If you had 30 more minutes, what you improve and why?”

This show depth of thinking beyond final code.

Why live editor is better than screen sharing
Screen sharing feel like watching demo. Live editor make interview interactive. Candidate see effect of changes instantly and you reason about code in same place.

LiveShare work well because editing happen inside editor with minimal setup. You can return to same shared link if something happen during call.
`,
  },
  "live-editor-vs-screen-sharing": {
    title: "Live Editor vs Screen Sharing — Why It Matters",
    date: "2026-08-03",
    content: `
Screen sharing is familiar, but many times it make working together passive. Live editors change this.

What usually go wrong with screen sharing
1) Cognitive load
Brain must understand what interviewer doing, what candidate seeing, and what changes mean.

2) Slower feedback loops
Edits get explained after they happen. With live editor, changes appear instantly in shared context.

3) Communication gaps
When candidate cannot edit (or scroll to exact lines), misunderstanding stay longer.

What live editors improve
Shared code context
Both sides work in same buffer. When change appear, it is immediately part of conversation.

Fewer setup distractions
People no need to copy environment or debug unrelated tooling issues mid-interview.

Better teaching and mentoring
When learning happen in code itself, students ask targeted questions about specific lines instead of only watching explanation.

Where LiveShare fit
LiveShare is optimized for short flow:
1) Paste code
2) Get unique link
3) Share and work together live

This help you start quickly and keep focus on reasoning — not on tooling.

Try for your next session
If you run pair programming, technical interview or tutoring session, test live editor approach for first 15 minutes. You will likely see faster progress and clearer communication.
`,
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const key = slug || "";

  const post = useMemo(() => POSTS[key], [key]);

  usePageSeo({
    title: post ? `${post.title} | LiveShare` : "Blog post | LiveShare",
    description:
      post?.content?.slice(0, 160) ||
      "Read guides about pair programming, remote coding interview and teaching with real-time shared editor.",
    canonicalPath: post ? `/blog/${key}` : "/blog",
    robots: "index, follow",
  });

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <p className="text-muted-foreground mb-6">
            This blog post does not exist.
          </p>
          <Link
            to="/blog"
            className="text-primary underline hover:text-primary/90"
          >
            Back to Blog
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-20 pb-10 sm:pb-12">
        <div className="max-w-3xl">
          <div className="text-sm text-muted-foreground mb-3">{post.date}</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">
            {post.title}
          </h1>
          <div className="prose prose-slate whitespace-pre-wrap">
            {post.content.trim()}
          </div>
          <div className="mt-8">
            <Link
              to="/blog"
              className="text-primary underline hover:text-primary/90"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
