import {getLocale, getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import {organizationSchema, websiteSchema} from "@/lib/seo/schema";
import type {Locale} from "@/i18n/locales";

export default async function HomeStructuredData() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("SEO")]);
  return <JsonLd data={[organizationSchema(t("organizationDescription")), websiteSchema(locale as Locale)]} />;
}
