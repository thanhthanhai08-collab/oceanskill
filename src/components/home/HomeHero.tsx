import {getLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function HomeHero() {
  const [t, locale] = await Promise.all([getTranslations("Home"), getLocale()]);
  return (
    <section className="home-hero relative isolate overflow-hidden border-b border-outline-variant/35">
      <div className="pointer-events-none absolute inset-0 -z-10 home-grid" />
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 sm:py-24 lg:min-h-[46rem] lg:grid-cols-12 lg:items-center lg:px-8 lg:py-28">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-3 border-l-2 border-primary pl-3">
            <span className="h-1.5 w-1.5 bg-primary" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">{t("heroBadge")}</span>
          </div>
          <h1 className="mt-8 max-w-4xl text-balance font-geist text-5xl font-semibold leading-[.98] tracking-[-0.045em] sm:text-7xl lg:text-[5.25rem]">
            {t("heroTitlePart1")} <span className="text-primary">{t("heroTitlePart2")}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-on-surface-variant">{t("heroDescription")}</p>
          <form action={`/${locale}/skills`} className="mt-9 max-w-2xl border-y border-outline-variant/55 py-4">
            <span className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">{t("heroSearchButton")}</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{t("heroSearchPlaceholder")}</span>
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[21px] text-primary">search</span>
                <input name="q" type="search" enterKeyHint="search" placeholder={t("heroSearchPlaceholder")} className="w-full border-0 border-b border-outline-variant/70 bg-transparent py-3 pl-8 pr-3 text-base outline-none transition placeholder:text-on-surface-variant/65 focus:border-primary" />
              </label>
              <button className="btn-payment rounded-md px-6 py-3 text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">{t("heroSearchButton")}</button>
            </div>
          </form>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/skills" className="btn-payment inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
              {t("heroExplore")}<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link href="/leaderboard" className="inline-flex items-center justify-center px-3 py-3.5 text-sm font-semibold text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("heroCreators")}</Link>
          </div>
        </div>
        <div aria-hidden="true" className="relative hidden min-h-[34rem] overflow-hidden border-l border-outline-variant/45 lg:col-span-5 lg:block">
          <div className="absolute inset-y-0 left-[28%] w-px bg-outline-variant/30" />
          <div className="absolute inset-y-0 left-[68%] w-px bg-outline-variant/30" />
          <div className="absolute inset-x-0 top-[22%] h-px bg-outline-variant/30" />
          <div className="absolute inset-x-0 top-[62%] h-px bg-outline-variant/30" />
          <div className="absolute -right-5 top-8 font-geist text-[12rem] font-semibold leading-none tracking-[-0.09em] text-primary/[.08] dark:text-primary/[.11]">OS</div>
          <div className="absolute left-[10%] top-[36%] h-32 w-32 border border-primary/55 bg-primary/[.04] shadow-[18px_18px_0_0_color-mix(in_srgb,var(--primary)_12%,transparent)]" />
          <div className="absolute left-[42%] top-[48%] h-40 w-40 border border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-sm" />
          <div className="absolute bottom-10 left-8 right-0 border-y border-outline-variant/50 py-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{t("heroSignal")}</span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-primary"><span className="h-1.5 w-1.5 bg-primary" />MCP / 01</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
