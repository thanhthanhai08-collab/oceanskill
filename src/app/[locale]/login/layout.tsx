import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import type {Locale} from "@/i18n/locales";
import {createPageMetadata} from "@/lib/seo/site";

export interface LoginLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: LoginLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "login", title: t("loginTitle"), description: t("siteDescription"), noIndex: true});
}

export default function LoginLayout({children}: LoginLayoutProps) { return children; }
