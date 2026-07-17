import {getTranslations} from "next-intl/server";
import SkillCard from "@/components/skills/SkillCard";
import SkillFilterBar from "@/components/skills/SkillFilterBar";
import {listPublicSkills} from "@/lib/catalog/skills";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, itemListSchema} from "@/lib/seo/schema";
import {localizedUrl} from "@/lib/seo/site";
import {listPublicCategories} from "@/lib/catalog/categories";
import {getPlatformSkillCollections} from "@/lib/skills/collections";
import {Link} from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export interface SkillsPageProps { readonly params: Promise<{locale: string}>; readonly searchParams: Promise<{q?: string; sort?: string}>; }

export default async function SkillsPage({params, searchParams}: SkillsPageProps) {
  const {locale} = await params;
  const [t, seo] = await Promise.all([getTranslations("Marketplace"), getTranslations("SEO")]);
  const {q = "", sort = "featured"} = await searchParams;
  const query = q.trim().toLocaleLowerCase();
  const [allSkills, allCategories, platformCollections] = await Promise.all([listPublicSkills(locale), listPublicCategories(locale), getPlatformSkillCollections(locale)]);
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
        {platformCollections.length > 0 && <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{t("collectionEyebrow")}</p><h2 className="mt-2 font-geist text-2xl font-bold">{t("collectionsTitle")}</h2></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{platformCollections.map((collection) => <Link key={collection.id} href={`/skills/collections/${collection.slug}` as "/skills"} className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-surface-container-low p-6 transition hover:-translate-y-1 hover:border-primary/45">
            <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary"><span className="material-symbols-outlined">stacks</span></span><span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase text-primary">{t("collectionCurated")}</span></div>
            <h3 className="mt-5 font-geist text-xl font-bold group-hover:text-primary">{collection.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{collection.description}</p>
            <p className="mt-4 font-mono text-xs text-on-surface-variant">{t("collectionSkillCount", {count: collection.skillIds.length})}</p>
          </Link>)}</div>
        </section>}
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
