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
  "debug-code-together-online": {
    title: "How to Debug Code Together Online (No Setup)",
    date: "2026-08-23",
    content: `
When code not working, many people send screenshot or long WhatsApp text. Friend still confuse because he not see full code. Better way is both sit in same editor and fix together.

This writing tell simple way to debug online with friend, teacher or junior — no install, no signup.

Why screenshot and screen share not enough
1) Screenshot show only small part
Friend see one error line. He not know nearby code.

2) Screen share is only watching
Other person cannot type. They cannot put console.log or try small change.

3) Setup take too much time
If you say clone my GitHub, then install start, and sometimes still not run same. 20-30 minute gone.

LiveShare solve this. You paste code, get link, share. Both edit same place.

How to debug together (simple steps)
Step 1: Open room
Open LiveShare and make new room. Account not need.

Step 2: Paste broken code
Paste file or small part where bug come. If error message is there, put that also on top as comment.

Step 3: Share link
Send URL to friend. They open browser and join.

Step 4: First talk about bug
Before edit, both agree:
- What should happen?
- What happen now?
- From when it break?

Step 5: Fix slow slow
Do like this:
1) See bug one time
2) Add one log
3) Change one thing
4) Check again
5) Tell what you understand

Don’t change 10 place together. Then more confuse.

Step 6: Clean the fix
When bug find, remove extra logs and keep code clean. If code private, put password on room.

Small tips
- First share only needed file, not full project.
- One person type 5 minute, then other person type.
- Speak your thinking (“maybe null come from API”).
- If stuck more than 10 minute, write small plan in comment then continue.

When this help
- Student stuck in homework and teacher help
- Junior need help from senior for one bug
- Interview later part when both debug together
- Open source help without install fight

End
Only voice call not enough for debug. Need same code in front of both. Paste code → share link → fix live. This is why LiveShare useful.
`,
  },
  "pair-programming-interview-tools": {
    title: "Best Free Tools for Pair Programming Interviews",
    date: "2026-08-03",
    content: `
Pair programming interview is hard for candidate and for interviewer also. Main problem is setup. Install, login, editor open — time finish and coding not start. Good tool remove this headache.

Here I write simple points for free tools (or no signup tools) for live coding interview.

What tool should have
1) Easy start
Candidate not need account or download. Only link is enough.

2) Both can type
If only one type and other watch, that is not real pair work. Both should see change live.

3) Language support
Tool should show nice color for JS, Python, Java, C++ etc. Whatever you ask in interview.

4) Password option
Some company want private room. So password option is good.

5) Refresh should work
Candidate refresh page and same room open again with same link. This is important.

Where LiveShare fit
LiveShare is made for this type fast interview:
- No signup.
- One link you share quickly.
- Edit in browser — no install.
- Password also available if you want.

How to use in interview
Before call
Make short question and small starter code. Decide what you check — correct answer, talking, edge case.

On call
Open room, tell candidate paste starter code. Check language is correct.

During coding
Go slow: write → test → explain. Ask candidate why they choose this way.

End
Tell summary, ask one question like “If more time, what you improve?”, then say next step.

Last line
Free tool also good if it is fast and both can edit. LiveShare flow is paste → share link → work together. Same thing interview need.
`,
  },
  "remote-coding-interview-step-by-step": {
    title: "How to Run Remote Coding Interview (Step by Step)",
    date: "2026-08-03",
    content: `
Remote coding interview work good when you treat it like together work, not only screen share show.

Here is simple steps you can follow.

1) Decide language early
Tell language and what type question. If algorithm, say roughly how hard. If product type, give input output example.

2) Share room link, not GitHub
Candidate should start in few seconds. GitHub many time fail because install and dependency problem.

Do like this:
- Make shared room
- Paste starter code
- Share link

3) Tell how you will work
Say clearly:
- Both can read and edit
- You ask why, not only what
- Test case also write in same editor

4) First 5-10 minute should show progress
- Candidate understand question
- Write small working code
- Add one test

5) Small cycle again and again
Write → run → explain → improve.

This keep candidate thinking, not confuse.

6) Check talking and correct code both
Good candidate explain trade-off. Good code also think about edge case.

If candidate stuck:
- Ask what they assume
- Tell write plan first
- Break problem small small

7) Last question
Near end ask:
“If 30 minute more, what you improve and why?”

This show thinking, not only final code.

Why live editor better than screen share
Screen share feel like demo video. Live editor is real work. Change show immediately and both talk on same code.

LiveShare good because setup almost zero. Same link you can open again if call have problem.
`,
  },
  "live-editor-vs-screen-sharing": {
    title: "Live Editor vs Screen Sharing — Why It Matters",
    date: "2026-08-03",
    content: `
Screen share everyone know. But many time it make other person only watching. Live editor change that.

Problem with screen sharing
1) Brain get tired
You try understand what interviewer doing, what candidate see, and what change mean — too much.

2) Feedback slow
First they edit, later they explain. In live editor change come same time.

3) Talk not clear
If candidate cannot edit or go to exact line, confuse stay long time.

What live editor make better
Same code in front of both
When someone type, other person see now. Talk become easy.

Less setup drama
No need same laptop setup in middle of interview. No random install error.

Teaching also better
Student can ask on exact line. Not only watch teacher slide or screen.

Where LiveShare fit
LiveShare flow is short:
1) Paste code
2) Get link
3) Share and work live

So you start fast and mind stay on problem, not on tool.

Try next time
If you do pair programming, interview or tuition, try live editor for first 15 minute. Mostly you feel work go faster and talk more clear.
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
      post?.content?.replace(/\s+/g, " ").trim().slice(0, 160) ||
      "Simple guides about pair programming, remote interview and teaching with live shared editor.",
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
            This blog post is not exist.
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">{post.title}</h1>
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
