import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env.ts";

/**
 * /written carries a cancel token in the page and /cancel is a form for
 * redeeming one. Neither has any business in a search index, and the API
 * routes have nothing to show a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/written", "/cancel", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
