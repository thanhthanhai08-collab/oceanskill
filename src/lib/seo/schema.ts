import {localizedUrl, getSiteUrl, siteName} from "@/lib/seo/site";
import type {Locale} from "@/i18n/locales";

export type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export function organizationSchema(description: string) {
  return {"@context": "https://schema.org", "@type": "Organization", name: siteName, url: getSiteUrl(), description};
}

export function websiteSchema(locale: Locale) {
  return {"@context": "https://schema.org", "@type": "WebSite", name: siteName, url: localizedUrl(locale), inLanguage: locale, potentialAction: {"@type": "SearchAction", target: `${localizedUrl(locale, "skills")}?q={search_term_string}`, "query-input": "required name=search_term_string"}};
}

export function breadcrumbSchema(items: ReadonlyArray<{name: string; url: string}>) {
  return {"@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({"@type": "ListItem", position: index + 1, name: item.name, item: item.url}))};
}

export function itemListSchema(input: Readonly<{name: string; description: string; items: ReadonlyArray<{name: string; url: string}>}>) {
  return {"@context": "https://schema.org", "@type": "ItemList", name: input.name, description: input.description, numberOfItems: input.items.length, itemListElement: input.items.map((item, index) => ({"@type": "ListItem", position: index + 1, name: item.name, url: item.url}))};
}

export function faqSchema(items: ReadonlyArray<{question: string; answer: string}>) {
  return {"@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((item) => ({"@type": "Question", name: item.question, acceptedAnswer: {"@type": "Answer", text: item.answer}}))};
}

export function skillSchema(input: Readonly<{name: string; description: string; url: string; version: string | null; clients: string[]; license: string | null; category: string; keywords?: string[]}>) {
  return {"@context": "https://schema.org", "@type": "SoftwareApplication", name: input.name, description: input.description, url: input.url, applicationCategory: input.category, keywords: input.keywords?.join(", ") || undefined, operatingSystem: input.clients.join(", ") || "AI agent clients", softwareVersion: input.version ?? undefined, license: input.license ?? undefined, publisher: {"@type": "Organization", name: siteName, url: getSiteUrl()}};
}

export function blogSchema(input: Readonly<{name: string; description: string; url: string; locale: Locale}>) {
  return {"@context": "https://schema.org", "@type": "Blog", name: input.name, description: input.description, url: input.url, inLanguage: input.locale, publisher: {"@type": "Organization", name: siteName, url: getSiteUrl()}};
}

export function articleSchema(input: Readonly<{headline: string; description: string; url: string; author: string; publishedAt: string; updatedAt: string; locale: Locale; category: string}>) {
  return {"@context": "https://schema.org", "@type": "BlogPosting", headline: input.headline, description: input.description, url: input.url, mainEntityOfPage: input.url, datePublished: input.publishedAt, dateModified: input.updatedAt, inLanguage: input.locale, articleSection: input.category, author: {"@type": "Organization", name: input.author}, publisher: {"@type": "Organization", name: siteName, url: getSiteUrl()}};
}

export function howToSchema(input: Readonly<{name: string; description: string; steps: ReadonlyArray<{name: string; text: string}>; locale: Locale; url: string}>) {
  return {"@context": "https://schema.org", "@type": "HowTo", name: input.name, description: input.description, inLanguage: input.locale, url: input.url, step: input.steps.map((step, index) => ({"@type": "HowToStep", position: index + 1, name: step.name, text: step.text}))};
}
