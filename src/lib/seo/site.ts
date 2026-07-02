import type {Metadata} from "next";
import {localeConfig, supportedLocales, type Locale} from "@/i18n/locales";

export const siteName = "OceanSkill";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return configured || "http://localhost:3000";
}

export function localizedUrl(locale: Locale, path = "") {
  const normalizedPath = path === "/" || path === "" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${getSiteUrl()}/${locale}${normalizedPath}`;
}

export function localizedAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages = Object.fromEntries(supportedLocales.map((code) => [localeConfig[code].hreflang, localizedUrl(code, path)]));
  return {canonical: localizedUrl(locale, path), languages: {...languages, "x-default": localizedUrl("vi", path)}};
}

export function createPageMetadata(input: Readonly<{
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  type?: "website" | "article";
  noIndex?: boolean;
}>): Metadata {
  const url = localizedUrl(input.locale, input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: localizedAlternates(input.locale, input.path),
    robots: input.noIndex ? {index: false, follow: false, nocache: true} : {index: true, follow: true},
    openGraph: {title: input.title, description: input.description, url, siteName, locale: localeConfig[input.locale].openGraphLocale, type: input.type ?? "website"},
    twitter: {card: "summary_large_image", title: input.title, description: input.description},
  };
}
