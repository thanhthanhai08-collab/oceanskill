import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import SkillCard from "@/components/skills/SkillCard";
import MarketplaceSidebar from "@/components/skills/MarketplaceSidebar";
import {listPublicSkills} from "@/lib/catalog/skills";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {breadcrumbSchema, itemListSchema} from "@/lib/seo/schema";
import {localizedUrl} from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export interface SkillsPageProps { readonly params: Promise<{locale: string}>; readonly searchParams: Promise<{q?: string; domain?: string; sort?: string}>; }

export default async function SkillsPage({params, searchParams}: SkillsPageProps) {
  const {locale} = await params;
  const [t, seo] = await Promise.all([getTranslations("Marketplace"), getTranslations("SEO")]);
  const {q = "", domain = "all", sort = "featured"} = await searchParams;
  const query = q.trim().toLocaleLowerCase();
  const allSkills = await listPublicSkills();
  const domains = [...new Set(allSkills.map((skill) => skill.domain))].sort();
  const filtered = allSkills.filter((skill) => (domain === "all" || skill.domain === domain) && (!query || `${skill.title} ${skill.description} ${skill.domain}`.toLocaleLowerCase().includes(query)));
  const skills = [...filtered].sort((a, b) => sort === "domain" ? a.domain.localeCompare(b.domain) : sort === "version" ? String(b.current_version).localeCompare(String(a.current_version)) : b.compatible_clients.length - a.compatible_clients.length || a.title.localeCompare(b.title));
  const code = locale as Locale;

  return (
    <SiteShell>
      <JsonLd data={[
        breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("marketplaceBreadcrumb"), url: localizedUrl(code, "skills")}]),
        itemListSchema({name: seo("marketplaceTitle"), description: seo("marketplaceDescription"), items: allSkills.map((skill) => ({name: skill.title, url: localizedUrl(code, `skills/${skill.slug}`)}))}),
      ]} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-tertiary">{t("eyebrow")}</p>
          <h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">{t("description")}</p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
          <MarketplaceSidebar skills={allSkills} domains={domains} activeDomain={domain} labels={{categories: t("categories"), allDomains: t("allDomains"), catalogRank: t("catalogRank"), trending: t("trending")}} />
          <div>
            <form className="grid gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-4 md:grid-cols-[1fr_190px_auto]">
              <label className="relative">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
                <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-3 pl-11 pr-4 outline-none transition focus:border-primary" />
              </label>
              <select name="sort" defaultValue={sort} className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary">
                <option value="featured">{t("sortFeatured")}</option>
                <option value="domain">{t("sortDomain")}</option>
                <option value="version">{t("sortVersion")}</option>
              </select>
              {domain !== "all" && <input type="hidden" name="domain" value={domain} />}
              <button className="rounded-lg bg-primary-container px-6 py-3 font-semibold text-white transition hover:bg-inverse-primary">{t("filter")}</button>
            </form>
            <div className="mt-7 flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">{t("resultCount", {count: skills.length})}</p>
              {domain !== "all" && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs capitalize text-primary">{domain}</span>}
            </div>
            {skills.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><>{skills.map((skill, index) => <SkillCard key={skill.id} skill={skill} featured={index === 0} actionLabel={t("viewSkill")} />)}</></div>
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center text-on-surface-variant">{t("empty")}</p>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
