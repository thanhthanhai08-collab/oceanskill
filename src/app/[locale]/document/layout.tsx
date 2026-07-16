import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, howToSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

type DocumentLayoutProps = Readonly<{children: React.ReactNode; params: Promise<{locale: string}>}>;

export async function generateMetadata({params}: DocumentLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "document", title: t("documentTitle"), description: t("documentDescription")});
}

export default async function DocumentLayout({children, params}: DocumentLayoutProps) {
  const {locale} = await params;
  const code = locale as Locale;
  const [seo, docs] = await Promise.all([getTranslations({locale, namespace: "SEO"}), getTranslations({locale, namespace: "Docs"})]);
  const url = localizedUrl(code, "document");
  const steps = ["account", "key", "client", "verify"] as const;
  return <><JsonLd data={[breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("documentBreadcrumb"), url}]), howToSchema({name: docs("startTitle"), description: docs("startDescription"), locale: code, url, steps: steps.map((step) => ({name: docs(`steps.${step}.title`), text: docs(`steps.${step}.description`)}))})]} />{children}</>;
}
