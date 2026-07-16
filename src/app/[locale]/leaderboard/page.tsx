import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import {getSkillLeaderboard, leaderboardPeriods, parseLeaderboardPeriod} from "@/lib/catalog/leaderboard";
import JsonLd from "@/components/seo/JsonLd";
import type {Locale} from "@/i18n/locales";
import {itemListSchema} from "@/lib/seo/schema";
import {localizedUrl} from "@/lib/seo/site";
import AdSlot from "@/components/ads/AdSlot";
import {Link} from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export interface LeaderboardPageProps {
  readonly params: Promise<{locale: string}>;
  readonly searchParams: Promise<{period?: string}>;
}

export default async function LeaderboardPage({params, searchParams}: LeaderboardPageProps) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  const period = parseLeaderboardPeriod(query.period);
  const [t, seo, skills] = await Promise.all([
    getTranslations("Leaderboard"),
    getTranslations("SEO"),
    getSkillLeaderboard(period, locale),
  ]);
  const code = locale as Locale;
  return (
    <SiteShell>
      <JsonLd data={itemListSchema({name: seo("leaderboardTitle"), description: seo("leaderboardDescription"), items: skills.map((skill) => ({name: skill.title, url: localizedUrl(code, `skills/${skill.slug}`)}))})} />
      <section className="relative overflow-hidden border-b border-outline-variant/35">
        <div className="pointer-events-none absolute inset-0 home-grid opacity-65" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-8">
            <p className="border-l-2 border-primary pl-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
            <h1 className="mt-7 max-w-4xl text-balance font-geist text-5xl font-semibold leading-[.98] tracking-[-0.045em] sm:text-7xl">{t("titleBefore")} <span className="text-primary">{t("titleAccent")}</span></h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-on-surface-variant">{t("description")}</p>
          </div>
          <div className="flex items-end lg:col-span-4">
            <div className="w-full border-y border-outline-variant/55 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{t("periodLabel")}</p><p className="mt-3 text-sm leading-6 text-on-surface-variant">{t(`periodDescriptions.${period}`)}</p></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <nav className="flex flex-wrap gap-x-1 border-b border-outline-variant/50" aria-label={t("periodLabel")}>
          {leaderboardPeriods.map((item) => <Link key={item} href={`/leaderboard?period=${item}`} aria-current={period === item ? "page" : undefined} className={`relative px-5 py-3 text-sm font-semibold transition ${period === item ? "text-primary after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{t(`periods.${item}`)}</Link>)}
        </nav>
        <AdSlot label={t("advertisement")} className="mt-10" />
        <div className="mt-12"><LeaderboardList skills={skills} locale={locale} labels={{calls: t("callsLabel"), rating: t("ratingLabel"), reviews: t("reviewsLabel"), noRating: t("noRating"), empty: t("empty")}} /></div>
        <p className="mt-8 max-w-3xl border-l border-outline-variant/70 pl-4 text-xs leading-5 text-on-surface-variant">{t("methodology")}</p>
      </section>
    </SiteShell>
  );
}
