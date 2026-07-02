import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {getPublicSkill} from "@/lib/catalog/skills";
import {breadcrumbSchema, faqSchema, skillSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

export interface SkillDetailLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string; slug: string}>; }

export async function generateMetadata({params}: SkillDetailLayoutProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const skill = await getPublicSkill(slug);
  if (!skill) return {title: "OceanSkill", robots: {index: false, follow: false}};
  return createPageMetadata({locale: locale as Locale, path: `skills/${slug}`, title: skill.title, description: skill.description, type: "article"});
}

export default async function SkillDetailLayout({children, params}: SkillDetailLayoutProps) {
  const {locale, slug} = await params;
  const skill = await getPublicSkill(slug);
  if (!skill) return children;
  const [t, detail] = await Promise.all([getTranslations({locale, namespace: "SEO"}), getTranslations({locale, namespace: "SkillDetail"})]);
  const code = locale as Locale;
  const url = localizedUrl(code, `skills/${slug}`);
  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([{name: t("homeBreadcrumb"), url: localizedUrl(code)}, {name: t("marketplaceBreadcrumb"), url: localizedUrl(code, "skills")}, {name: skill.title, url}]),
        skillSchema({name: skill.title, description: skill.description, url, version: skill.current_version, clients: skill.compatible_clients, license: skill.license_spdx, category: t("skillCategory")}),
        faqSchema(["faqOne", "faqTwo", "faqThree"].map((key) => ({question: detail(`${key}Question`), answer: detail(`${key}Answer`)}))),
      ]} />
      {children}
    </>
  );
}
