import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import DashboardStat from "@/components/dashboard/DashboardStat";
import {getUsageEvents, type McpCallEvent, type UsageEvent, type UsageRange} from "@/lib/usage/events";
import {getCategoryVisual} from "@/data/mockData";

export const dynamic = "force-dynamic";

type UsagePageProps = {
  readonly params: Promise<{locale: string}>;
  readonly searchParams: Promise<{range?: string; from?: string; to?: string}>;
};

type SkillUsageRow = Readonly<{
  key: string;
  title: string;
  category: string;
  calls: number;
  units: number;
  successRate: number;
  lastUsed: string;
}>;

const labels = {
  vi: {
    range24h: "24 giờ",
    range7d: "7 ngày",
    custom: "Tùy chỉnh",
    from: "Từ ngày",
    to: "Đến ngày",
    apply: "Áp dụng",
    mcpCalls: "Lượt gọi MCP",
    paidCalls: "Lượt trả phí",
    creditsSpent: "Credit đã trừ",
    successfulCalls: "Tool call thành công",
    paidDescription: "get_skill_md và get_skill_reference trừ 1 credit sau mỗi lần gọi mới thành công.",
    chartDescription: "Biểu đồ đang đọc từ mcp_call_events do Edge Function ghi sau mỗi tool call thành công.",
    recentMcpCalls: "Lượt MCP gần đây",
    tool: "Tool",
    requestId: "Request ID",
    time: "Thời gian",
    noMcpCalls: "Chưa có lượt MCP nào trong khoảng thời gian này.",
    selectedRange: "Khoảng đang xem",
  },
  en: {
    range24h: "24h",
    range7d: "7 days",
    custom: "Custom",
    from: "From",
    to: "To",
    apply: "Apply",
    mcpCalls: "MCP calls",
    paidCalls: "Paid calls",
    creditsSpent: "Credits spent",
    successfulCalls: "Successful tool calls",
    paidDescription: "get_skill_md and get_skill_reference debit 1 credit after each successful new call.",
    chartDescription: "The chart reads mcp_call_events recorded by the Edge Function after each successful tool call.",
    recentMcpCalls: "Recent MCP calls",
    tool: "Tool",
    requestId: "Request ID",
    time: "Time",
    noMcpCalls: "No MCP calls in this range yet.",
    selectedRange: "Selected range",
  },
} as const;

function getSkillMeta(event: UsageEvent) {
  const raw = Array.isArray(event.skills) ? event.skills[0] : event.skills;
  return {
    title: raw?.title ?? event.tool_name,
    category: raw?.category ?? "ai-agent",
  };
}

function isSuccessful(status: string) {
  return status === "succeeded" || status === "ok" || status === "reserved";
}

function buildSkillRows(events: UsageEvent[]): SkillUsageRow[] {
  const rows = new Map<string, {title: string; category: string; calls: number; units: number; ok: number; lastUsed: string}>();
  for (const event of events) {
    const meta = getSkillMeta(event);
    const key = event.skill_id ?? event.tool_name;
    const current = rows.get(key) ?? {title: meta.title, category: meta.category, calls: 0, units: 0, ok: 0, lastUsed: event.created_at};
    current.calls += 1;
    current.units += event.units;
    current.ok += isSuccessful(event.status) ? 1 : 0;
    if (new Date(event.created_at) > new Date(current.lastUsed)) current.lastUsed = event.created_at;
    rows.set(key, current);
  }
  return [...rows.entries()]
    .map(([key, row]) => ({key, title: row.title, category: row.category, calls: row.calls, units: row.units, successRate: row.calls ? row.ok / row.calls : 0, lastUsed: row.lastUsed}))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 8);
}

function startOfHour(value: Date) {
  const date = new Date(value);
  date.setMinutes(0, 0, 0);
  return date;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateInput(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function resolveRange(input: {range?: string; from?: string; to?: string}) {
  const now = new Date();
  const selected = input.range === "custom" || input.range === "24h" ? input.range : "7d";
  if (selected === "24h") {
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {selected, from, to: now, bucket: "hour" as const};
  }
  if (selected === "custom") {
    const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = parseDateInput(input.from, defaultFrom);
    const to = parseDateInput(input.to, now);
    to.setUTCHours(23, 59, 59, 999);
    const safeTo = to > from ? to : now;
    const diffHours = (safeTo.getTime() - from.getTime()) / 36e5;
    return {selected, from, to: safeTo, bucket: diffHours <= 48 ? "hour" as const : "day" as const};
  }
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {selected: "7d" as const, from, to: now, bucket: "day" as const};
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildTrend(events: McpCallEvent[], range: ReturnType<typeof resolveRange>, locale: string) {
  const buckets: Array<{start: Date; end: Date; label: string; calls: number}> = [];
  if (range.bucket === "hour") {
    const first = startOfHour(range.from);
    for (let cursor = first; cursor < range.to && buckets.length < 72;) {
      const start = new Date(cursor);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      buckets.push({start, end, label: start.toLocaleTimeString(locale, {hour: "2-digit"}), calls: 0});
      cursor = end;
    }
  } else {
    const first = startOfDay(range.from);
    for (let cursor = first; cursor < range.to && buckets.length < 62;) {
      const start = new Date(cursor);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({start, end, label: start.toLocaleDateString(locale, {day: "2-digit", month: "short"}), calls: 0});
      cursor = end;
    }
  }

  for (const event of events) {
    const created = new Date(event.created_at);
    const bucket = buckets.find((item) => created >= item.start && created < item.end);
    if (bucket) bucket.calls += 1;
  }
  return buckets;
}

export default async function UsagePage({params, searchParams}: UsagePageProps) {
  const {locale} = await params;
  const query = await searchParams;
  const code = locale === "vi" ? "vi" : "en";
  const range = resolveRange(query);
  const dbRange: UsageRange = {from: range.from.toISOString(), to: range.to.toISOString()};
  const [t, data] = await Promise.all([
    getTranslations("Dashboard"),
    getUsageEvents({limit: 50, range: dbRange}),
  ]);

  if (!data) redirect(`/${locale}/login`);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(v));
  const compact = new Intl.NumberFormat(locale, {notation: "compact", maximumFractionDigits: 1});
  const paidEvents = data.analyticsEvents;
  const totalUnits = paidEvents.reduce((sum, event) => sum + event.units, 0);
  const successCount = data.mcpCallEvents.filter((event) => isSuccessful(event.status)).length;
  const successRate = data.totalMcpCalls ? successCount / data.totalMcpCalls : 0;
  const rows = buildSkillRows(paidEvents);
  const trend = buildTrend(data.mcpCallEvents, range, locale);
  const maxTrend = Math.max(...trend.map((item) => item.calls), 1);
  const points = trend.map((item, index) => {
    const x = (index / Math.max(trend.length - 1, 1)) * 100;
    const y = 88 - (item.calls / maxTrend) * 68;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = points ? `0,100 ${points} 100,100` : "";
  const selectedRangeLabel = `${formatDate(range.from.toISOString())} - ${formatDate(range.to.toISOString())}`;
  const rangeHref = (value: "24h" | "7d") => `/${locale}/dashboard/usage?range=${value}`;

  return (
    <section className="pb-16">
      <header>
        <h1 className="font-geist text-5xl font-bold tracking-tight">{t("usageTitle")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("usageDescription")}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat icon="api" label={labels[code].mcpCalls} value={data.totalMcpCalls.toLocaleString(locale)} description={labels[code].successfulCalls} accent="tertiary" />
        <DashboardStat icon="paid" label={labels[code].paidCalls} value={data.paidTotal.toLocaleString(locale)} description={labels[code].paidDescription} />
        <DashboardStat icon="check_circle" label={t("successRate")} value={`${(successRate * 100).toFixed(2)}%`} description={`${successCount.toLocaleString(locale)} / ${data.totalMcpCalls.toLocaleString(locale)}`} accent="secondary" />
        <DashboardStat icon="account_balance_wallet" label={labels[code].creditsSpent} value={totalUnits.toLocaleString(locale)} description={labels[code].selectedRange} />
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="font-geist text-2xl font-bold">{t("usageTrend")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{labels[code].chartDescription}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-tertiary">{selectedRangeLabel}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <a href={rangeHref("24h")} className={`rounded-md px-3 py-2 ${range.selected === "24h" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:text-primary"}`}>{labels[code].range24h}</a>
              <a href={rangeHref("7d")} className={`rounded-md px-3 py-2 ${range.selected === "7d" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:text-primary"}`}>{labels[code].range7d}</a>
              <span className={`rounded-md px-3 py-2 ${range.selected === "custom" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{labels[code].custom}</span>
            </div>
            <form action={`/${locale}/dashboard/usage`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="range" value="custom" />
              <label className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels[code].from}</span>
                <input type="date" name="from" defaultValue={formatDateInput(range.from)} className="h-10 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels[code].to}</span>
                <input type="date" name="to" defaultValue={formatDateInput(range.to)} className="h-10 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary" />
              </label>
              <button className="btn-payment self-end rounded-lg px-4 py-2.5 text-sm font-bold hover:brightness-105">{labels[code].apply}</button>
            </form>
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
            {areaPoints && <polygon points={areaPoints} className="text-primary" fill="url(#usageArea)" />}
            {points && <polyline points={points} fill="none" className="text-primary" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />}
            {trend.map((item, index) => {
              const x = (index / Math.max(trend.length - 1, 1)) * 100;
              const y = 88 - (item.calls / maxTrend) * 68;
              return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="1.15" className="fill-primary" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
        </div>
        <div className="mt-3 grid gap-2 text-center font-mono text-[10px] text-on-surface-variant" style={{gridTemplateColumns: `repeat(${Math.min(trend.length, 12)}, minmax(0, 1fr))`}}>
          {trend.filter((_, index) => trend.length <= 12 || index % Math.ceil(trend.length / 12) === 0).map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
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
                  const visual = getCategoryVisual(row.category);
                  return (
                    <tr key={row.key} className="transition hover:bg-white/[0.03]">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest ${visual.accentClass}`}><span className="material-symbols-outlined text-[20px]">{visual.icon}</span></span>
                          <div><p className="font-geist font-bold">{row.title}</p><p className="text-xs text-on-surface-variant">{row.category}</p></div>
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

      <section className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55">
        <div className="border-b border-white/5 p-6">
          <h2 className="font-geist text-2xl font-bold">{code === "vi" ? "Lượt gọi MCP gần đây" : "Recent MCP calls"}</h2>
        </div>
        {data.mcpCallEvents.length === 0 ? (
          <p className="p-8 text-sm text-on-surface-variant">{labels[code].noMcpCalls}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{labels[code].tool}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">API key</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{code === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="p-5 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{labels[code].time}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.mcpCallEvents.slice(0, 50).map((event) => (
                  <tr key={event.id} className="transition hover:bg-white/[0.03]">
                    <td className="p-5 font-semibold">{event.tool_name}</td>
                    <td className="p-5 font-mono text-xs text-on-surface-variant">{event.api_key_id.slice(0, 8)}...</td>
                    <td className="p-5">
                      <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase ${isSuccessful(event.status) ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>
                        {isSuccessful(event.status) ? (code === "vi" ? "Thành công" : "Succeeded") : (code === "vi" ? "Thất bại" : "Failed")}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-on-surface-variant">{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
