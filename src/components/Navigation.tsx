import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useNavigateToRandomEditor } from "@/hooks/use-random-editor";
import { useTranslation } from "react-i18next";

export const Navigation = () => {
  const navigateToRandomEditor = useNavigateToRandomEditor();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container-fluid px-2 sm:px-2 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <Code2 className="h-5 w-5 sm:h-6 sm:w-6 brand-icon" />
            <span className="brand-lightning">LiveShare</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={navigateToRandomEditor}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("nav.editor")}
            </button>
            <LanguageSelector />
            <ThemeToggle />
            <Button
              onClick={navigateToRandomEditor}
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              {t("nav.newSession")}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
