import {getTranslations} from "next-intl/server";

export interface AboutSectionProps { readonly skillCount: number; }

export default async function AboutSection({skillCount}: AboutSectionProps) {
  const t = await getTranslations("Home");
  const metrics = [
    {value: String(skillCount), label: t("metricSkills")},
    {value: "MCP", label: t("metricDelivery")},
    {value: "RLS", label: t("metricSecurity")},
  ];
  return (
    <section id="about" className="scroll-mt-28 bg-surface-container-low/55 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{t("aboutEyebrow")}</p>
          <h2 className="mt-5 max-w-xl text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("aboutTitle")}</h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-on-surface-variant">{t("aboutDescription")}</p>
        </div>
        <div className="border-t border-outline-variant/50 lg:col-span-6 lg:col-start-7">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="grid grid-cols-[3rem_1fr] gap-5 border-b border-outline-variant/50 py-6 sm:grid-cols-[3rem_7rem_1fr] sm:items-baseline">
              <span className="font-mono text-[10px] text-on-surface-variant">0{index + 1}</span>
              <p className="font-geist text-3xl font-semibold tabular-nums text-primary">{metric.value}</p>
              <p className="col-start-2 text-sm leading-6 text-on-surface-variant sm:col-start-auto">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
