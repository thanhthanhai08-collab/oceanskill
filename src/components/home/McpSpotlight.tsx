import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function McpSpotlight() {
  const t = await getTranslations("Home");
  const steps = ["discover", "connect", "invoke"] as const;
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/25 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_15%_50%,rgba(0,220,229,.12),transparent_30%),radial-gradient(circle_at_85%_40%,rgba(125,1,177,.18),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-tertiary/30 bg-tertiary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary"><span className="material-symbols-outlined text-[16px]">hub</span>MCP</div><h2 className="mt-5 font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("mcpTitle")}</h2><p className="mt-4 max-w-xl leading-7 text-on-surface-variant">{t("mcpDescription")}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/document" className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-sm font-semibold text-white transition hover:bg-inverse-primary">{t("mcpDocsCta")}<span className="material-symbols-outlined text-[18px]">menu_book</span></Link><Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/50 px-6 py-3 text-sm font-semibold text-on-surface hover:border-primary/60">{t("mcpCta")}</Link></div></div>
        <div className="grid gap-4 sm:grid-cols-3">{steps.map((step, index) => <div key={step} className="glass-panel rounded-2xl p-5"><span className="font-mono text-xs text-primary">0{index + 1}</span><span className="material-symbols-outlined mt-6 block text-3xl text-tertiary">{step === "discover" ? "search" : step === "connect" ? "cable" : "bolt"}</span><h3 className="mt-4 font-geist text-lg font-semibold">{t(`mcpSteps.${step}.title`)}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{t(`mcpSteps.${step}.description`)}</p></div>)}</div>
      </div>
    </section>
  );
}
