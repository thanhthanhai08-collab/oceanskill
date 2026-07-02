import type {MetadataRoute} from "next";
import {supportedLocales, type Locale} from "@/i18n/locales";
import {listPublicSkills} from "@/lib/catalog/skills";
import {localizedUrl} from "@/lib/seo/site";
import {getBlogPosts} from "@/content/blog";

export const revalidate = 3600;

const publicRoutes = [
  {path: "", changeFrequency: "weekly" as const, priority: 1},
  {path: "skills", changeFrequency: "daily" as const, priority: 0.9},
  {path: "leaderboard", changeFrequency: "daily" as const, priority: 0.8},
  {path: "blog", changeFrequency: "weekly" as const, priority: 0.8},
  {path: "docs", changeFrequency: "monthly" as const, priority: 0.8},
  {path: "faq", changeFrequency: "monthly" as const, priority: 0.8},
];

function languageAlternates(path: string) {
  return {languages: Object.fromEntries(supportedLocales.map((locale) => [locale, localizedUrl(locale, path)]))};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = publicRoutes.flatMap((route) => supportedLocales.map((locale) => ({url: localizedUrl(locale, route.path), lastModified: new Date(), changeFrequency: route.changeFrequency, priority: route.priority, alternates: languageAlternates(route.path)})));
  for (const post of getBlogPosts("en")) {
    const path = `blog/${post.slug}`;
    for (const locale of supportedLocales) entries.push({url: localizedUrl(locale, path), lastModified: new Date(post.updatedAt), changeFrequency: "monthly", priority: 0.75, alternates: languageAlternates(path)});
  }
  try {
    const skills = await listPublicSkills();
    for (const skill of skills) {
      const path = `skills/${skill.slug}`;
      for (const locale of supportedLocales) entries.push({url: localizedUrl(locale as Locale, path), lastModified: new Date(skill.updated_at), changeFrequency: "weekly", priority: 0.8, alternates: languageAlternates(path)});
    }
  } catch {
    // Static routes remain discoverable when the catalog is temporarily unavailable.
  }
  return entries;
}
