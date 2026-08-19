import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";

const YOUR_EMAIL = "liveshare.help@gmail.com";
const COMPANY_NAME = "liveshare";

export default function PrivacyPolicy() {
  usePageSeo({
    title: "Privacy Policy | LiveShare",
    description:
      "LiveShare privacy policy — what we collect, cookies, analytics, and how shared code rooms work.",
    canonicalPath: "/privacy-policy",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-[5.5rem] sm:pt-20 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Privacy Policy
        </h1>

        <div className="prose prose-slate max-w-4xl">
          <p>
            This Privacy Policy explain how <b>{COMPANY_NAME}</b> collect,
            use and share information when you use LiveShare (“we”, “us” or
            “our”). LiveShare is free real-time code editor. You can paste code,
            get shareable link and work together in one room with other people.
            No signup need.
          </p>

          <h2>1. Information we collect</h2>
          <h3>Personal information</h3>
          <p>
            LiveShare work without account. But if you use contact form or
            feedback form (optional), we may get name and email address which
            you write there.
          </p>

          <h3>Technical data</h3>
          <p>
            When you visit site, we may collect technical info like IP address,
            browser type, device info and approximate location from IP. We use
            this for security, analytics and to make site faster.
          </p>

          <h3>Cookies and similar technologies</h3>
          <p>
            We and third-party providers may use cookies, local storage and
            similar things to run site, remember your choice (like theme) and
            measure performance.
          </p>

          <h3>Shared code room data</h3>
          <p>
            When you make shared room (paste code and get link), LiveShare store
            the code content in backend database so other people can open link
            and work together. Code can update when you edit in editor.
          </p>

          <h2>2. How we use information</h2>
          <ul>
            <li>
              <b>To run the service:</b> load rooms, sync changes and make
              live editing work.
            </li>
            <li>
              <b>For security and reliability:</b> stop abuse and fix problems.
            </li>
            <li>
              <b>To improve website:</b> use analytics to understand traffic and
              performance.
            </li>
          </ul>

          <h2>3. Cookies (AdSense and personalization)</h2>
          <p>
            If you see ads on site, Google AdSense and related services may use
            cookies for ad personalization and measurement. This policy explain
            cookies generally. Ad personalization also follow Google’s ad
            policies.
          </p>
          <p>
            You can control cookies in browser settings. We also show cookie
            consent banner so you can choose if non-essential cookies are ok.
          </p>

          <h2>4. Third-party services</h2>
          <p>LiveShare may use third-party services such as:</p>
          <ul>
            <li>
              <b>Google Analytics / analytics providers</b> for usage and
              performance measurement.
            </li>
            <li>
              <b>Google services</b> (including AdSense) if ads are shown.
            </li>
            <li>
              <b>Hosting and infrastructure providers</b> to run the service.
            </li>
          </ul>
          <p>
            Providers and setup can change over time. If you have question,
            contact us at <b>{YOUR_EMAIL}</b>.
          </p>

          <h2>5. Data retention</h2>
          <p>
            Room content must be stored so shared links work. We do not have
            fixed delete schedule written in app right now. You can update code
            in editor. To remove data fully you may need to contact support.
          </p>

          <h2>6. Your choices</h2>
          <ul>
            <li>
              <b>Cookie preferences:</b> use cookie banner and browser settings.
            </li>
            <li>
              <b>Contact us:</b> email us for privacy questions or requests.
            </li>
          </ul>

          <h2>7. Contact</h2>
          <p>
            For privacy questions, email <b>{YOUR_EMAIL}</b>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
