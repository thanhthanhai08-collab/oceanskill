import type {MetadataRoute} from "next";
import {getSiteUrl} from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {rules: [{userAgent: "*", allow: "/", disallow: ["/vi/dashboard", "/en/dashboard", "/vi/login", "/en/login", "/api/"]}], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl};
}
