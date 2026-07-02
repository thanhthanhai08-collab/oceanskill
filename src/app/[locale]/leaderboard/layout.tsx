import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

export interface LeaderboardLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: LeaderboardLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "leaderboard", title: t("leaderboardTitle"), description: t("leaderboardDescription")});
}

export default async function LeaderboardLayout({children, params}: LeaderboardLayoutProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  const code = locale as Locale;
  return <><JsonLd data={breadcrumbSchema([{name: t("homeBreadcrumb"), url: localizedUrl(code)}, {name: t("leaderboardBreadcrumb"), url: localizedUrl(code, "leaderboard")}])} />{children}</>;
}
