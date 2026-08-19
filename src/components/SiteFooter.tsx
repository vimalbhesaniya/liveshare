import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigateToRandomEditor } from "@/hooks/use-random-editor";
import { SiteFooterAdSlot } from "@/components/ads/SiteFooterAdSlot";

export function SiteFooter() {
  const navigateToRandomEditor = useNavigateToRandomEditor();
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="text-center text-muted-foreground space-y-4">
          <p className="text-sm">{t("footer.usedBy")}</p>

          {/* Footer navigation for crawlers / AdSense */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t("footer.home")}
            </Link>
            <button
              onClick={navigateToRandomEditor}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.liveShareCode")}
            </button>
            <Link
              to="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link
              to="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </nav>

          <SiteFooterAdSlot />

          <p className="text-xs mt-4">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

