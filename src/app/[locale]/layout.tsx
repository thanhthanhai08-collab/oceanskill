/* eslint-disable @next/next/no-page-custom-font */
import type {Metadata} from "next";
import Script from "next/script";
import {Analytics} from "@vercel/analytics/next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import type {Locale} from "@/i18n/locales";
import {createPageMetadata, getSiteUrl} from "@/lib/seo/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: "SEO"});
  return {
    ...createPageMetadata({locale: locale as Locale, title: t("siteTitle"), description: t("siteDescription")}),
    metadataBase: new URL(getSiteUrl()),
    applicationName: "OceanSkill",
    category: "technology",
    keywords: ["AI agent skills", "MCP skills", "Codex", "Claude Code", "Cursor", "Supabase"],
    title: {default: t("siteTitle"), template: "%s | OceanSkill"},
    icons: {icon: "/favicon.ico"},
  };
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning className="h-full antialiased">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <Script
          id="theme-preload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
