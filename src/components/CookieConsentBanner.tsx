import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "liveshare-cookie-consent-v1";

/**
 * Lightweight cookie consent banner for AdSense / privacy compliance.
 * We do not dynamically load ad scripts yet (placeholders only).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) setVisible(true);
    } catch {
      // If storage is blocked, fall back to showing the banner.
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ consent: true }));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const reject = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ consent: false, necessaryOnly: true }),
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-background/95 backdrop-blur p-3 sm:p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">
              Cookies and privacy
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              We use cookies and similar things to run site and improve
              performance. If you accept analytics and ad cookies, we may use
              Google services (including analytics and AdSense).{" "}
              <a
                className="underline hover:text-foreground"
                href="/privacy-policy"
              >
                Read more
              </a>
              .
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              onClick={reject}
              className="flex-1 sm:flex-none"
            >
              Reject
            </Button>
            <Button onClick={accept} className="flex-1 sm:flex-none">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
