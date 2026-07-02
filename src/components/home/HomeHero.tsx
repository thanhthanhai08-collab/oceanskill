import {getLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function HomeHero() {
  const [t, locale] = await Promise.all([getTranslations("Home"), getLocale()]);
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/25">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_60%_20%,rgba(46,91,255,.2),transparent_36%),radial-gradient(circle_at_85%_55%,rgba(125,1,177,.15),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_12px_var(--tertiary)]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{t("heroBadge")}</span>
          </div>
          <h1 className="mt-7 max-w-3xl font-geist text-4xl font-bold leading-[1.06] tracking-tight sm:text-6xl">
            {t("heroTitlePart1")} <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">{t("heroTitlePart2")}</span>
          </h1>
          <form action={`/${locale}/skills`} className="mt-7 flex max-w-2xl flex-col gap-3 rounded-2xl border border-primary/30 bg-surface-container-low/75 p-2 shadow-[0_18px_60px_rgba(46,91,255,.12)] backdrop-blur sm:flex-row">
            <label className="relative flex-1"><span className="sr-only">{t("heroSearchPlaceholder")}</span><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[22px] text-tertiary">search</span><input name="q" type="search" enterKeyHint="search" placeholder={t("heroSearchPlaceholder")} className="w-full rounded-xl border border-transparent bg-surface-container-lowest py-4 pl-12 pr-4 text-base outline-none transition placeholder:text-on-surface-variant/70 focus:border-primary" /></label>
            <button className="rounded-xl bg-primary-container px-6 py-4 text-sm font-semibold text-white transition hover:bg-inverse-primary">{t("heroSearchButton")}</button>
          </form>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">{t("heroDescription")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/skills" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-primary-container/20 transition hover:bg-inverse-primary">
              {t("heroExplore")}<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link href="/leaderboard" className="glass-panel inline-flex items-center justify-center rounded-lg px-7 py-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container">{t("heroCreators")}</Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-low shadow-2xl shadow-primary-container/10 lg:aspect-[4/3]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/25 via-transparent to-secondary-container/30" />
          <div className="absolute inset-[12%] rotate-6 rounded-[2rem] border border-primary/25 bg-background/70 shadow-[0_0_80px_rgba(46,91,255,.2)] backdrop-blur-xl" />
          <div className="absolute inset-[25%] -rotate-6 rounded-3xl border border-tertiary/30 bg-surface-container-high/80" />
          <span className="material-symbols-outlined absolute inset-0 grid place-items-center text-[108px] text-primary drop-shadow-[0_0_24px_rgba(184,195,255,.5)]">neurology</span>
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-xl border border-white/10 bg-background/70 p-4 backdrop-blur">
            <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">{t("heroSignal")}</span>
            <span className="font-mono text-xs text-tertiary">100%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
