import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import {listPublicSkills} from "@/lib/catalog/skills";
import {rankSkillsByReadiness} from "@/lib/catalog/readiness";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {itemListSchema} from "@/lib/seo/schema";
import {localizedUrl} from "@/lib/seo/site";
import AdSlot from "@/components/ads/AdSlot";

export const dynamic = "force-dynamic";

export interface LeaderboardPageProps { readonly params: Promise<{locale: string}>; }

export default async function LeaderboardPage({params}: LeaderboardPageProps) {
  const {locale} = await params;
  const [t, seo] = await Promise.all([getTranslations("Leaderboard"), getTranslations("SEO")]);
  const skills = rankSkillsByReadiness(await listPublicSkills(locale));
  const code = locale as Locale;
  return (
    <SiteShell>
      <JsonLd data={itemListSchema({name: seo("leaderboardTitle"), description: seo("leaderboardDescription"), items: skills.map((skill) => ({name: skill.title, url: localizedUrl(code, `skills/${skill.slug}`)}))})} />
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-tertiary">{t("eyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-geist text-4xl font-bold tracking-tight sm:text-6xl">{t("titleBefore")} <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">{t("titleAccent")}</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">{t("description")}</p>
        </div>
        <div className="mx-auto mt-10 flex w-fit rounded-xl border border-outline-variant/50 bg-surface-container p-1">
          <span className="rounded-lg bg-background px-5 py-3 font-mono text-xs font-semibold text-primary shadow-sm">{t("tabSkills")}</span>
          <span className="px-5 py-3 font-mono text-xs text-on-surface-variant">{t("tabReadiness")}</span>
        </div>
        <AdSlot label={t("advertisement")} className="mt-10" />
        <div className="mt-14"><LeaderboardList skills={skills} scoreLabel={t("scoreLabel")} integrationsLabel={t("integrationsLabel")} /></div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-on-surface-variant">{t("methodology")}</p>
      </section>
    </SiteShell>
  );
}
