import { Bookmark, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type RetentionPromptProps = {
  open: boolean;
  onDismiss: () => void;
  onCreateAnother: () => void;
};

export function RetentionPrompt({
  open,
  onDismiss,
  onCreateAnother,
}: RetentionPromptProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  const shortcut = isMac ? "⌘ + D" : "Ctrl + D";

  return (
    <div
      className="fixed bottom-24 left-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-6"
      role="dialog"
      aria-label={t("retention.title")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("retention.title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {t("retention.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("retention.dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex gap-2 rounded-lg bg-muted/50 p-3">
        <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-foreground">
            {t("retention.bookmark")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("retention.bookmarkDesc", { shortcut })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="sm" className="flex-1" onClick={onCreateAnother}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("retention.createAnother")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onDismiss}
        >
          {t("retention.stayHere")}
        </Button>
      </div>
    </div>
  );
}
