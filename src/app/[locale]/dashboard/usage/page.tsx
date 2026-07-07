import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getUsageEvents, type UsageEvent} from "@/lib/usage/events";
import {getDomainVisual} from "@/data/mockData";

export const dynamic = "force-dynamic";

type SkillUsageRow = Readonly<{
  key: string;
  title: string;
  domain: string;
  calls: number;
  units: number;
  successRate: number;
  lastUsed: string;
}>;

function getSkillMeta(event: UsageEvent) {
  const raw = Array.isArray(event.skills) ? event.skills[0] : event.skills;
  return {
    title: raw?.title ?? event.tool_name,
    domain: raw?.domain ?? "agent-first",
  };
}

function isSuccessful(status: string) {
  return status === "succeeded" || status === "ok" || status === "reserved";
}

function buildSkillRows(events: UsageEvent[]): SkillUsageRow[] {
  const rows = new Map<string, {title: string; domain: string; calls: number; units: number; ok: number; lastUsed: string}>();
  for (const event of events) {
    const meta = getSkillMeta(event);
    const key = event.skill_id ?? event.tool_name;
    const current = rows.get(key) ?? {title: meta.title, domain: meta.domain, calls: 0, units: 0, ok: 0, lastUsed: event.created_at};
    current.calls += 1;
    current.units += event.units;
    current.ok += isSuccessful(event.status) ? 1 : 0;
    if (new Date(event.created_at) > new Date(current.lastUsed)) current.lastUsed = event.created_at;
    rows.set(key, current);
  }
  return [...rows.entries()]
    .map(([key, row]) => ({key, title: row.title, domain: row.domain, calls: row.calls, units: row.units, successRate: row.calls ? row.ok / row.calls : 0, lastUsed: row.lastUsed}))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 8);
}

function buildSevenDayTrend(events: UsageEvent[], locale: string) {
  const now = new Date();
  const days = Array.from({length: 7}, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });
  return days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const calls = events.filter((event) => {
      const created = new Date(event.created_at);
      return created >= day && created < next;
    }).length;
    return {
      label: day.toLocaleDateString(locale, {day: "2-digit", month: "short"}),
      calls,
    };
  });
}

export default async function UsagePage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, data] = await Promise.all([
    getTranslations("Dashboard"),
    getUsageEvents({limit: 50}),
  ]);

  if (!data) redirect(`/${locale}/login`);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(v));
  const compact = new Intl.NumberFormat(locale, {notation: "compact", maximumFractionDigits: 1});
  const analyticsEvents = data.analyticsEvents;
  const totalUnits = analyticsEvents.reduce((sum, event) => sum + event.units, 0);
  const successCount = analyticsEvents.filter((event) => isSuccessful(event.status)).length;
  const successRate = analyticsEvents.length ? successCount / analyticsEvents.length : 0;
  const estimatedCost = totalUnits * 0.00125;
  const rows = buildSkillRows(analyticsEvents);
  const trend = buildSevenDayTrend(analyticsEvents, locale);
  const maxTrend = Math.max(...trend.map((item) => item.calls), 1);
  const points = trend.map((item, index) => {
    const x = (index / Math.max(trend.length - 1, 1)) * 100;
    const y = 88 - (item.calls / maxTrend) * 68;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <section className="pb-16">
      <header>
        <h1 className="font-geist text-5xl font-bold tracking-tight">{t("usageTitle")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("usageDescription")}</p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
          <span className="material-symbols-outlined text-primary">api</span>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t("totalCalls")}</p>
          <p className="mt-3 font-geist text-3xl font-bold">{data.total.toLocaleString(locale)}</p>
          <p className="mt-2 text-xs font-semibold text-tertiary">{t("usageExactHint")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
          <span className="material-symbols-outlined text-primary">timer</span>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t("totalUnits")}</p>
          <p className="mt-3 font-geist text-3xl font-bold">{totalUnits.toLocaleString(locale)}</p>
          <p className="mt-2 text-xs font-semibold text-tertiary">{t("lastThousandEvents")}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-surface-container-low/55 p-6 shadow-[0_0_24px_rgba(184,195,255,0.08)]">
          <span className="material-symbols-outlined text-secondary">check_circle</span>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t("successRate")}</p>
          <p className="mt-3 font-geist text-3xl font-bold">{(successRate * 100).toFixed(2)}%</p>
          <p className="mt-2 text-xs font-semibold text-secondary">{t("reliabilityHigh")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
          <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t("estimatedCost")}</p>
          <p className="mt-3 font-geist text-3xl font-bold">${estimatedCost.toFixed(2)}</p>
          <p className="mt-2 text-xs font-semibold text-on-surface-variant">{t("currentMonthEstimate")}</p>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-geist text-2xl font-bold">{t("usageTrend")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("usageTrendDescription")}</p>
          </div>
          <div className="flex gap-2 text-xs font-bold text-on-surface-variant">
            <span>24 giờ</span><span className="rounded-md bg-primary px-3 py-1 text-on-primary">7 ngày</span><span>30 ngày</span>
          </div>
        </div>
        <div className="mt-7 h-72 rounded-xl bg-surface-container-lowest p-5">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="usageArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <g className="text-outline-variant/30">
              {[20, 40, 60, 80].map((x) => <line key={`x-${x}`} x1={x} x2={x} y1="10" y2="95" stroke="currentColor" strokeWidth="0.15" />)}
              {[28, 55, 82].map((y) => <line key={`y-${y}`} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeWidth="0.15" />)}
            </g>
            <polygon points={areaPoints} className="text-primary" fill="url(#usageArea)" />
            <polyline points={points} fill="none" className="text-primary" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
            {trend.map((item, index) => {
              const x = (index / Math.max(trend.length - 1, 1)) * 100;
              const y = 88 - (item.calls / maxTrend) * 68;
              return <circle key={item.label} cx={x} cy={y} r="1.15" className="fill-primary" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2 text-center font-mono text-[10px] text-on-surface-variant">
          {trend.map((item) => <span key={item.label}>{item.label}</span>)}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55">
        <div className="flex flex-col gap-4 border-b border-white/5 p-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-geist text-2xl font-bold">{t("usageBySkill")}</h2>
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
            {t("searchSkillPlaceholder")}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-on-surface-variant">{t("emptyUsage")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{t("colSkill")}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{t("colCalls")}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{t("successRate")}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{t("totalUnits")}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{t("lastUsed")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => {
                  const visual = getDomainVisual(row.domain);
                  return (
                    <tr key={row.key} className="transition hover:bg-white/[0.03]">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest ${visual.accentClass}`}><span className="material-symbols-outlined text-[20px]">{visual.icon}</span></span>
                          <div><p className="font-geist font-bold">{row.title}</p><p className="text-xs text-on-surface-variant">{row.domain}</p></div>
                        </div>
                      </td>
                      <td className="p-5 font-geist font-bold">{compact.format(row.calls)}</td>
                      <td className="p-5 font-geist font-bold text-tertiary">{(row.successRate * 100).toFixed(2)}%</td>
                      <td className="p-5 text-on-surface-variant">{row.units.toLocaleString(locale)}</td>
                      <td className="p-5 text-sm text-on-surface-variant">{formatDate(row.lastUsed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
