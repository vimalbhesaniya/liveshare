import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageSeo } from "@/hooks/use-page-seo";
import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  usePageSeo({
    title: "Page not found - LiveShare",
    description: "This page not found on LiveShare.",
    canonicalPath: location.pathname || "/",
    robots: "noindex, nofollow",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 pt-[5.5rem] sm:pt-20 pb-12">
        <div className="flex items-center justify-center">
          <div className="text-center max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold">{t("notFound.title")}</h1>
            <p className="mb-4 text-xl text-muted-foreground">
              {t("notFound.message")}
            </p>
            <a href="/" className="text-primary underline hover:text-primary/90">
              {t("notFound.returnHome")}
            </a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
