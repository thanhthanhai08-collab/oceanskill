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
    <section id="about" className="scroll-mt-28 py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">{t("aboutEyebrow")}</p>
          <h2 className="mt-4 max-w-xl font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("aboutTitle")}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-on-surface-variant">{t("aboutDescription")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel rounded-2xl p-6">
              <p className="font-geist text-3xl font-bold text-primary">{metric.value}</p>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
