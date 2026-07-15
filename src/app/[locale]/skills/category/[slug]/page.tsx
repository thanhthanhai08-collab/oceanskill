import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import SiteShell from "@/components/layout/SiteShell";
import SkillCard from "@/components/skills/SkillCard";
import type {Locale} from "@/i18n/locales";
import {getPublicCategory} from "@/lib/catalog/categories";
import {listPublicSkills} from "@/lib/catalog/skills";
import {breadcrumbSchema, itemListSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

type CategoryPageProps = Readonly<{params: Promise<{locale: string; slug: string}>}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: CategoryPageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const category = await getPublicCategory(slug, locale);
  if (!category) return {title: "OceanSkill", robots: {index: false, follow: false}};
  return createPageMetadata({locale: locale as Locale, path: `skills/category/${slug}`, title: category.seoTitle, description: category.seoDescription});
}

export default async function CategoryPage({params}: CategoryPageProps) {
  const {locale, slug} = await params;
  const [category, allSkills, t, seo] = await Promise.all([
    getPublicCategory(slug, locale),
    listPublicSkills(locale),
    getTranslations({locale, namespace: "Marketplace"}),
    getTranslations({locale, namespace: "SEO"}),
  ]);
  if (!category) notFound();
  const skills = allSkills.filter((skill) => skill.category === category.slug);
  const code = locale as Locale;
  const url = localizedUrl(code, `skills/category/${slug}`);

  return (
    <SiteShell>
      <JsonLd data={[
        breadcrumbSchema([
          {name: seo("homeBreadcrumb"), url: localizedUrl(code)},
          {name: seo("marketplaceBreadcrumb"), url: localizedUrl(code, "skills")},
          {name: category.name, url},
        ]),
        itemListSchema({name: category.seoTitle, description: category.seoDescription, items: skills.map((skill) => ({name: skill.title, url: localizedUrl(code, `skills/${skill.slug}`)}))}),
      ]} />
      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/20 via-secondary/15 to-tertiary/10 text-primary shadow-[0_0_30px_rgba(184,195,255,0.16)]">
                <span className="material-symbols-outlined text-5xl">{category.icon}</span>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("categoryEyebrow")}</p>
                <h1 className="mt-3 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{category.name}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface-variant">{category.description}</p>
              </div>
            </div>
            <div className="min-w-52 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{t("categorySkillCount", {count: skills.length})}</p>
              <p className="mt-2 font-geist text-3xl font-bold">{skills.length}</p>
            </div>
          </div>
        </section>
        <div className="mb-8 mt-12 flex items-center gap-4">
          <h2 className="shrink-0 font-geist text-2xl font-bold">{t("categorySkillCount", {count: skills.length})}</h2>
          <div className="h-px w-full bg-gradient-to-r from-outline-variant/70 to-transparent" />
        </div>
        {skills.length ? (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skills.map((skill, index) => <SkillCard key={skill.id} skill={skill} featured={index === 0} actionLabel={t("viewSkill")} categoryName={category.name} />)}
          </section>
        ) : (
          <p className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-on-surface-variant">{t("categoryEmpty")}</p>
        )}
      </main>
    </SiteShell>
  );
}
