import {getTranslations} from "next-intl/server";
import SkillCard from "@/components/skills/SkillCard";
import SkillFilterBar from "@/components/skills/SkillFilterBar";
import {listPublicSkills} from "@/lib/catalog/skills";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, itemListSchema} from "@/lib/seo/schema";
import {localizedUrl} from "@/lib/seo/site";
import {listPublicCategories} from "@/lib/catalog/categories";

export const dynamic = "force-dynamic";

export interface SkillsPageProps { readonly params: Promise<{locale: string}>; readonly searchParams: Promise<{q?: string; sort?: string}>; }

export default async function SkillsPage({params, searchParams}: SkillsPageProps) {
  const {locale} = await params;
  const [t, seo] = await Promise.all([getTranslations("Marketplace"), getTranslations("SEO")]);
  const {q = "", sort = "featured"} = await searchParams;
  const query = q.trim().toLocaleLowerCase();
  const [allSkills, allCategories] = await Promise.all([listPublicSkills(locale), listPublicCategories(locale)]);
  const availableCategorySlugs = new Set(allSkills.map((skill) => skill.category));
  const categories = allCategories.filter((item) => availableCategorySlugs.has(item.slug));
  const categoryNames = new Map(categories.map((item) => [item.slug, item.name]));
  const filtered = allSkills.filter((skill) => !query || `${skill.title} ${skill.description} ${skill.category}`.toLocaleLowerCase().includes(query));
  const skills = [...filtered].sort((a, b) => sort === "category" ? a.category.localeCompare(b.category) : sort === "version" ? String(b.current_version).localeCompare(String(a.current_version)) : b.compatible_clients.length - a.compatible_clients.length || a.title.localeCompare(b.title));
  const code = locale as Locale;

  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("marketplaceBreadcrumb"), url: localizedUrl(code, "skills")}]),
        itemListSchema({name: seo("marketplaceTitle"), description: seo("marketplaceDescription"), items: allSkills.map((skill) => ({name: skill.title, url: localizedUrl(code, `skills/${skill.slug}`)}))}),
      ]} />
      <section>
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-tertiary">{t("eyebrow")}</p>
          <h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">{t("description")}</p>
        </div>
        <div className="mt-12">
          <SkillFilterBar query={q} sort={sort} labels={{searchPlaceholder: t("searchPlaceholder"), sortFeatured: t("sortFeatured"), sortCategory: t("sortCategory"), sortVersion: t("sortVersion"), filter: t("filter")}} />
          <div className="mt-7 flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">{t("resultCount", {count: skills.length})}</p>
          </div>
          {skills.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><>{skills.map((skill, index) => <SkillCard key={skill.id} skill={skill} featured={index === 0} actionLabel={t("viewSkill")} categoryName={categoryNames.get(skill.category)} />)}</></div>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center text-on-surface-variant">{t("empty")}</p>
          )}
        </div>
      </section>
    </>
  );
}
