import { useEffect } from "react";

type PageSeoOptions = {
  title: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  ogImage?: string;
};

/** Canonical production host (apex redirects to www). */
export const SITE_ORIGIN = "https://www.liveshare.dev";

const DEFAULT_DESCRIPTION =
  "Share code in real-time with developers in your browser. An online code editor for interviews, troubleshooting, teaching.";

const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Updates document title + core meta for client-side routes.
 * Homepage defaults live in index.html for first paint / crawlers.
 */
export function usePageSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  robots = DEFAULT_ROBOTS,
  ogImage = `${SITE_ORIGIN}/og-image.png`,
}: PageSeoOptions) {
  useEffect(() => {
    const path = canonicalPath.startsWith("/")
      ? canonicalPath
      : `/${canonicalPath}`;
    const canonical =
      path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;

    document.title = title;
    upsertCanonical(canonical);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots.includes("noindex") ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:image:secure_url", ogImage);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:url", canonical);
    upsertMeta("name", "twitter:image", ogImage);
  }, [title, description, canonicalPath, robots, ogImage]);
}
