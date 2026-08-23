import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigateToRandomEditor } from "@/hooks/use-random-editor";
import { SiteFooterAdSlot } from "@/components/ads/SiteFooterAdSlot";

export function SiteFooter() {
  const navigateToRandomEditor = useNavigateToRandomEditor();
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center text-muted-foreground space-y-4">
          <p className="text-xs sm:text-sm px-2 leading-relaxed">
            {t("footer.usedBy")}
          </p>

          {/* Footer navigation for crawlers / AdSense */}
          <nav className="flex flex-wrap justify-center gap-x-3 gap-y-2 sm:gap-x-5 sm:gap-y-3 text-xs sm:text-sm px-1">
            <Link
              to="/"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              {t("footer.home")}
            </Link>
            <button
              type="button"
              onClick={navigateToRandomEditor}
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              {t("footer.liveShareCode")}
            </button>
            <Link
              to="/about"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              About
            </Link>
            <Link
              to="/faq"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              FAQ
            </Link>
            <Link
              to="/blog"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              Contact
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-foreground transition-colors px-1 py-0.5"
            >
              Terms of Service
            </Link>
          </nav>

          <SiteFooterAdSlot />

          <p className="text-[11px] sm:text-xs mt-4 px-2 leading-relaxed break-words">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
