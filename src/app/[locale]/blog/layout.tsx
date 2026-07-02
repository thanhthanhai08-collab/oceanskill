import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {blogSchema, breadcrumbSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

export interface BlogLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: BlogLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "blog", title: t("blogTitle"), description: t("blogDescription")});
}

export default async function BlogLayout({children, params}: BlogLayoutProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  const code = locale as Locale;
  const url = localizedUrl(code, "blog");
  return <><JsonLd data={[breadcrumbSchema([{name: t("homeBreadcrumb"), url: localizedUrl(code)}, {name: t("blogBreadcrumb"), url}]), blogSchema({name: t("blogTitle"), description: t("blogDescription"), url, locale: code})]} />{children}</>;
}
