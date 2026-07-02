import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import type {Locale} from "@/i18n/locales";
import {createPageMetadata} from "@/lib/seo/site";

export interface SkillsLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: SkillsLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "skills", title: t("marketplaceTitle"), description: t("marketplaceDescription")});
}

export default function SkillsLayout({children}: SkillsLayoutProps) {
  return children;
}
