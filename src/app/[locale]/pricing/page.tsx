import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";

const plans = [
  {key: "free", credits: "50", icon: "explore", pack: null, popular: false, layout: "xl:col-span-5"},
  {key: "starter", credits: "200", icon: "bolt", pack: "starter_20k", popular: false, layout: "xl:col-span-7"},
  {key: "builder", credits: "600", icon: "rocket_launch", pack: "builder_50k", popular: true, layout: "xl:col-span-7"},
  {key: "power", credits: "1,400", icon: "rocket", pack: "power_100k", popular: false, layout: "xl:col-span-5"},
] as const;
const usageItems = ["charged", "free", "retry", "failed"] as const;
const compareRows = ["credits", "privateSkills", "expiry", "keys", "collections", "usage"] as const;
const faqs = ["subscription", "slots", "request", "refund"] as const;

export default async function PricingPage() {
  const t = await getTranslations("Pricing");

  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</span>
            <h1 className="mt-7 max-w-4xl font-geist text-4xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("description")}</p>
          </div>
          <aside className="payment-gradient rounded-3xl p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-65">{t("slotEyebrow")}</p>
            <p className="mt-4 font-geist text-4xl font-bold">5.000 VND</p>
            <p className="mt-2 text-sm leading-6 opacity-75">{t("slotDescription")}</p>
            <Link href="/dashboard/billing/topup?purpose=creator-slots&amount=5000" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-white/75 px-5 py-3 text-sm font-bold text-[#25213a] transition hover:bg-white">{t("buySlots")}</Link>
          </aside>
        </header>

        <section className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {plans.map((plan) => {
            const features = t.raw(`plans.${plan.key}.features`) as string[];
            return (
              <article key={plan.key} className={`relative flex flex-col rounded-3xl border p-6 ${plan.layout} ${plan.popular ? "border-secondary/50 bg-gradient-to-b from-secondary/15 to-surface-container-low/75" : "border-outline-variant/40 bg-surface-container-low/55"}`}>
                {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-secondary/15 px-3 py-1 font-mono text-[10px] font-bold uppercase text-secondary">{t("popular")}</span>}
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${plan.popular ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}><span className="material-symbols-outlined">{plan.icon}</span></span>
                <h2 className="mt-6 font-geist text-2xl font-bold">{t(`plans.${plan.key}.name`)}</h2>
                <p className="mt-2 min-h-16 text-sm leading-6 text-on-surface-variant">{t(`plans.${plan.key}.description`)}</p>
                <p className="mt-6 font-geist text-3xl font-bold">{t(`plans.${plan.key}.price`)}</p>
                <p className="mt-1 font-mono text-xs text-on-surface-variant">{plan.credits} {t("credits")} · {plan.pack ? t("oneTime") : t("trialBadge")}</p>
                <ul className="mt-7 space-y-3 text-sm text-on-surface-variant">
                  {features.map((feature) => <li key={feature} className="flex items-start gap-2"><span className="material-symbols-outlined mt-0.5 text-[17px] text-primary">check_circle</span><span>{feature}</span></li>)}
                </ul>
                {plan.pack ? <Link href={{pathname: "/dashboard/billing/topup", query: {pack: plan.pack}}} className={`mt-8 flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${plan.popular ? "bg-secondary text-on-secondary hover:opacity-90" : "border border-primary/40 text-primary hover:bg-primary/10"}`}>{t("choosePaid")}</Link> : <Link href="/signup" className="btn-payment mt-8 flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-105">{t("chooseFree")}</Link>}
              </article>
            );
          })}
        </section>

        <section className="mt-24">
          <div className="max-w-3xl"><h2 className="font-geist text-3xl font-bold sm:text-4xl">{t("usageTitle")}</h2><p className="mt-4 leading-7 text-on-surface-variant">{t("usageDescription")}</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {usageItems.map((item, index) => <article key={item} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/50 p-5"><span className="material-symbols-outlined text-2xl text-tertiary">{["paid", "search", "replay", "undo"][index]}</span><h3 className="mt-4 font-geist text-xl font-bold">{t(`usage.${item}.title`)}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{t(`usage.${item}.description`)}</p></article>)}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="font-geist text-3xl font-bold sm:text-4xl">{t("compareTitle")}</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-outline-variant/40">
            <table className="w-full min-w-[760px] text-left"><thead className="bg-surface-container-high/60"><tr><th className="p-5" /><th className="p-5">Free</th><th className="p-5">Starter</th><th className="p-5 text-secondary">Builder</th><th className="p-5">Power</th></tr></thead><tbody className="divide-y divide-outline-variant/30">
              {compareRows.map((row) => <tr key={row} className="bg-surface-container-low/35"><th className="p-5 text-sm font-semibold">{t(`compare.${row}`)}</th>{plans.map((plan) => <td key={plan.key} className="p-5 text-sm text-on-surface-variant">{row === "credits" ? plan.credits : row === "privateSkills" ? t("compare.skillSlots") : row === "expiry" ? t("compare.never") : t("compare.included")}</td>)}</tr>)}
            </tbody></table>
          </div>
        </section>

        <section className="mt-24"><h2 className="font-geist text-3xl font-bold sm:text-4xl">{t("faqTitle")}</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{faqs.map((faq) => <article key={faq} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/50 p-6"><h3 className="font-geist text-lg font-semibold">{t(`faq.${faq}.q`)}</h3><p className="mt-3 text-sm leading-6 text-on-surface-variant">{t(`faq.${faq}.a`)}</p></article>)}</div></section>

        <section className="mt-24 overflow-hidden rounded-3xl bg-gradient-to-r from-primary-container/80 via-secondary-container/80 to-tertiary/70 p-8 text-white sm:p-10"><h2 className="max-w-3xl font-geist text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2><p className="mt-4 max-w-2xl text-white/80">{t("ctaDescription")}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl bg-white px-6 py-3 font-semibold text-on-primary">{t("ctaFree")}</Link><Link href="/document" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white">{t("ctaDocs")}</Link></div></section>
      </main>
    </SiteShell>
  );
}
