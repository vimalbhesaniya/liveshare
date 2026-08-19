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
    <div className="fixed bottom-0 inset-x-0 z-[100] px-3 pb-3">
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-background/95 backdrop-blur p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">Cookies and privacy</p>
            <p className="text-sm text-muted-foreground mt-1">
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reject}
              className="whitespace-nowrap"
            >
              Reject
            </Button>
            <Button onClick={accept} className="whitespace-nowrap">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

