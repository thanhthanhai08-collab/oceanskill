import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, faqSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

interface FaqLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string}>; }

export async function generateMetadata({params}: FaqLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "faq", title: t("faqTitle"), description: t("faqDescription")});
}

export default async function FaqLayout({children, params}: FaqLayoutProps) {
  const {locale} = await params;
  const code = locale as Locale;
  const [seo, faq] = await Promise.all([getTranslations({locale, namespace: "SEO"}), getTranslations({locale, namespace: "FAQ"})]);
  const items = faq.raw("items") as Array<{question: string; answer: string}>;
  return <><JsonLd data={[breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("faqBreadcrumb"), url: localizedUrl(code, "faq")}]), faqSchema(items)]}/>{children}</>;
}
