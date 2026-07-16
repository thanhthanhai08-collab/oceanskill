import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

type PricingLayoutProps = Readonly<{children: React.ReactNode; params: Promise<{locale: string}>}>;

export async function generateMetadata({params}: PricingLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "pricing", title: t("pricingTitle"), description: t("pricingDescription")});
}

export default async function PricingLayout({children, params}: PricingLayoutProps) {
  const {locale} = await params;
  const code = locale as Locale;
  const seo = await getTranslations({locale, namespace: "SEO"});
  return <><JsonLd data={breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("pricingBreadcrumb"), url: localizedUrl(code, "pricing")}])} />{children}</>;
}
