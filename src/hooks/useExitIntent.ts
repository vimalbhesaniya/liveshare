import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "liveshare-exit-feedback-shown";

/**
 * Hook to detect exit intent and trigger feedback modal only on first occurrence.
 * Triggers on:
 * - Mouse leaving the top of the viewport (desktop exit intent - e.g. moving cursor to close tab)
 * - Page visibility hidden (user switching tab or minimizing - we show modal when they return)
 */
export function useExitIntent(): [boolean, () => void] {
  const [showFeedback, setShowFeedback] = useState(false);

  const shouldShow = useCallback(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  }, []);

  const markAsShown = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShowFeedback(false);
  }, []);

  const openFeedback = useCallback(() => {
    if (shouldShow()) {
      localStorage.setItem(STORAGE_KEY, "1");
      setShowFeedback(true);
    }
  }, [shouldShow]);

  // Desktop: mouse leaves top of viewport (exit intent - cursor moving toward address bar/close)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && shouldShow()) {
        openFeedback();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [openFeedback, shouldShow]);

  return [showFeedback, markAsShown];
}
