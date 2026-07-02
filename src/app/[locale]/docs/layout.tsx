import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, howToSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

export interface DocsLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: DocsLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "docs", title: t("docsTitle"), description: t("docsDescription")});
}

export default async function DocsLayout({children, params}: DocsLayoutProps) {
  const {locale} = await params;
  const code = locale as Locale;
  const [seo, docs] = await Promise.all([getTranslations({locale, namespace: "SEO"}), getTranslations({locale, namespace: "Docs"})]);
  const url = localizedUrl(code, "docs");
  const steps = ["account", "configure", "verify"] as const;
  return <><JsonLd data={[breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("docsBreadcrumb"), url}]), howToSchema({name: docs("quickstartTitle"), description: docs("quickstartDescription"), locale: code, url, steps: steps.map((step) => ({name: docs(`steps.${step}.title`), text: docs(`steps.${step}.description`)}))})]} />{children}</>;
}
