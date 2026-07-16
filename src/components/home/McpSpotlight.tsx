import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function McpSpotlight() {
  const t = await getTranslations("Home");
  const steps = ["discover", "connect", "invoke"] as const;
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/35 bg-primary/[.055] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 home-grid opacity-50" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-12 lg:items-start lg:px-8">
        <div className="lg:col-span-7"><div className="inline-flex items-center gap-3 border-l-2 border-primary pl-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">MCP</div><h2 className="mt-6 max-w-3xl text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("mcpTitle")}</h2><p className="mt-5 max-w-2xl text-pretty leading-7 text-on-surface-variant">{t("mcpDescription")}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/document" className="inline-flex items-center gap-2 rounded-md bg-primary-container px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110">{t("mcpDocsCta")}<span className="material-symbols-outlined text-[18px]">menu_book</span></Link><Link href="/login" className="inline-flex items-center gap-2 px-4 py-3.5 text-sm font-semibold text-on-surface underline decoration-outline-variant underline-offset-4 transition hover:text-primary hover:decoration-primary">{t("mcpCta")}</Link></div></div>
        <ol className="border-t border-outline-variant/50 lg:col-span-5">{steps.map((step, index) => <li key={step} className="grid grid-cols-[auto_1fr] gap-5 border-b border-outline-variant/50 py-6"><span className="font-mono text-[11px] text-primary">0{index + 1}</span><div><h3 className="font-geist text-lg font-semibold">{t(`mcpSteps.${step}.title`)}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{t(`mcpSteps.${step}.description`)}</p></div></li>)}</ol>
      </div>
    </section>
  );
}
