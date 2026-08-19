import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";

const YOUR_EMAIL = "liveshare.help@gmail.com";
const COMPANY_NAME = "liveshare";

export default function TermsOfService() {
  usePageSeo({
    title: "Terms of Service | LiveShare",
    description:
      "LiveShare Terms of Service — acceptable use, your content responsibility, and limits of liability.",
    canonicalPath: "/terms-of-service",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-[5.5rem] sm:pt-20 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Terms of Service
        </h1>

        <div className="prose prose-slate max-w-4xl">
          <p>
            These Terms of Service (“Terms”) govern how you use LiveShare,
            provided by <b>{COMPANY_NAME}</b> (“we”, “us”, “our”). By using
            website you agree to these Terms.
          </p>

          <h2>1. The service</h2>
          <p>
            LiveShare is free real-time code editor without signup. You paste
            code/text in shared room and work together with others through
            unique link. Some rooms can have password to limit access.
          </p>

          <h2>2. Acceptable use</h2>
          <p>
            You agree not to use LiveShare to upload, post, share or send
            content that is illegal, harmful or violate others’ rights. This
            include (but not limited to):
          </p>
          <ul>
            <li>Malware, exploits or instructions to cause harm.</li>
            <li>Copyright breaking content or trade secrets.</li>
            <li>Personal data you do not have right to share.</li>
            <li>Any content that break applicable laws or rules.</li>
          </ul>

          <h2>3. Content responsibility (including pasted code)</h2>
          <p>
            LiveShare let users paste any text, code and instructions. You are
            fully responsible for content you share. We do not guarantee content
            is safe, correct or suitable for everyone.
          </p>

          <h2>4. Moderation and removal</h2>
          <p>
            LiveShare is not moderated live stream where we check every code
            while you type. If we get report of illegal or harmful content, we
            may review and take action to protect users and follow laws. Room
            content may be opened by anyone who has shared link (unless password
            is set).
          </p>

          <h2>5. Storage and access</h2>
          <p>
            To make shared links work, LiveShare store room data (including your
            pasted code) on backend so others can view and edit. Content can
            update during editing session. We do not give “delete forever”
            button in app UI right now. If you need help removing content,
            contact us at <b>{YOUR_EMAIL}</b>.
          </p>

          <h2>6. Limitation of liability</h2>
          <p>
            As much as law allow, we are not liable for indirect, incidental,
            special or other damages from your use of LiveShare. This include
            damages related to content shared in rooms.
          </p>

          <h2>7. Disclaimers</h2>
          <p>
            Service is provided “as is” and “as available” without warranty of
            any kind. We do not promise service will always work without stop or
            without error.
          </p>

          <h2>8. Contact</h2>
          <p>
            Questions about these Terms can be sent to <b>{YOUR_EMAIL}</b>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
