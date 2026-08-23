import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Code2, Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useNavigateToRandomEditor } from "@/hooks/use-random-editor";
import { useTranslation } from "react-i18next";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

export const Navigation = () => {
  const navigateToRandomEditor = useNavigateToRandomEditor();
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on desktop resize + lock body scroll while open
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-[100vw] px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink text-base sm:text-xl font-bold text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Code2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 brand-icon" />
              <span className="brand-lightning truncate">LiveShare</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Desktop links */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm text-muted-foreground mr-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={navigateToRandomEditor}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {t("nav.editor")}
                </button>
              </div>

              {/* Mobile hamburger */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 lg:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              <LanguageSelector />
              <ThemeToggle />

              <Button
                onClick={navigateToRandomEditor}
                variant="ghost"
                size="sm"
                className="h-9 px-2 sm:px-3 text-xs sm:text-sm"
                aria-label={t("nav.newSession")}
              >
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline max-w-[7.5rem] truncate">
                  {t("nav.newSession")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" id="mobile-nav-drawer">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-0 right-0 h-full w-[min(18rem,85vw)] bg-background border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Menu</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-lg px-3 py-3 text-sm transition-colors ${
                      location.pathname === link.to
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent/60"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigateToRandomEditor();
                  }}
                  className="rounded-lg px-3 py-3 text-left text-sm text-foreground hover:bg-accent/60 transition-colors"
                >
                  {t("nav.editor")}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
