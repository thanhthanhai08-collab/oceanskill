import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import DashboardStat from "@/components/dashboard/DashboardStat";
import {getDashboardOverview} from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export interface DashboardPageProps { readonly params: Promise<{locale: string}>; }

function isSuccessfulStatus(status: string) {
  return status === "succeeded" || status === "ok" || status === "reserved";
}

function formatUsageStatus(status: string, locale: string) {
  if (locale !== "vi") return status;
  if (isSuccessfulStatus(status)) return "Thành công";
  if (status === "failed" || status === "fail") return "Thất bại";
  return status;
}

export default async function DashboardPage({params}: DashboardPageProps) {
  const {locale} = await params;
  const [t, data] = await Promise.all([getTranslations("Dashboard"), getDashboardOverview()]);
  if (!data) redirect(`/${locale}/login`);

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));
  return (
    <>
      <header>
        <h1 className="text-balance font-geist text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">{t("overviewTitle")}</h1>
        <p className="mt-4 max-w-2xl text-pretty leading-7 text-on-surface-variant">{t("description")}</p>
      </header>

      <section className="payment-gradient relative mt-10 overflow-hidden rounded-2xl border border-white/20 px-6 py-9 shadow-[0_0_34px_rgba(129,123,190,0.32),0_18px_70px_rgba(76,132,177,0.18)] sm:px-8 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-10">
        <div className="pointer-events-none absolute inset-0 home-grid opacity-20" />
        <div className="relative lg:col-span-8"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#25213a]/75 dark:text-white/75">{t("availableCredits")}</p><p className="mt-3 flex flex-wrap items-end gap-3 font-geist text-6xl font-semibold leading-none tabular-nums tracking-[-0.05em] sm:text-7xl">{data.balance.toLocaleString(locale)}<span className="mb-1 text-base font-medium tracking-normal text-[#25213a]/70 dark:text-white/65">{t("creditUnit")}</span></p><p className="mt-5 max-w-2xl text-sm leading-6 text-[#25213a]/75 dark:text-white/70">{t("mcpCallsDescription")}</p></div>
        <div className="relative mt-7 lg:col-span-4 lg:mt-0 lg:text-right"><a href={`/${locale}/dashboard/billing/topup`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#18181b] shadow-lg shadow-[#525c90]/20 transition hover:-translate-y-0.5 hover:bg-white/90"><span className="material-symbols-outlined text-[18px]">add</span>{t("topUp")}</a></div>
      </section>

      <section className="mt-7 grid border-y border-outline-variant/50 sm:grid-cols-2 sm:divide-x sm:divide-outline-variant/50 xl:grid-cols-4">
        <DashboardStat icon="deployed_code" label={t("skillsUploaded")} value={String(data.userSkillCount)} />
        <DashboardStat icon="api" label={t("mcpCalls")} value={data.usageCount.toLocaleString(locale)} description={t("mcpCallsDescription")} />
        <DashboardStat icon="key" label={t("activeKeys")} value={String(data.activeKeyCount)} />
        <DashboardStat icon="receipt_long" label={t("ordersCount")} value={String(data.orders.length)} />
      </section>

      <section className="mt-12">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><h2 className="font-geist text-3xl font-semibold tracking-tight">{t("recentUsage")}</h2><p className="mt-2 text-sm text-on-surface-variant">{t("recentUsageDescription")}</p></div><Link href="/dashboard/usage" className="text-sm font-semibold text-primary underline decoration-outline-variant underline-offset-4 transition hover:decoration-primary">{t("viewAllUsage")}</Link></div>
        <div className="mt-6 overflow-hidden border-y border-outline-variant/50">
          {data.usage.length === 0 ? <p className="py-10 text-sm text-on-surface-variant">{t("emptyUsage")}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-outline-variant/50 bg-surface-container-low/60"><tr><th className="px-5 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colTool")}</th><th className="px-5 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colStatus")}</th><th className="px-5 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("creditsUsed")}</th><th className="px-5 py-4 text-right font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colDate")}</th></tr></thead><tbody className="divide-y divide-outline-variant/35">{data.usage.map((item) => <tr key={item.id} className="transition hover:bg-surface-container-low/45"><td className="px-5 py-4"><span className="font-semibold">{item.tool_name}</span></td><td className="px-5 py-4"><span className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase ${isSuccessfulStatus(item.status) ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-300"}`}>{formatUsageStatus(item.status, locale)}</span></td><td className="px-5 py-4 tabular-nums text-on-surface-variant">{item.units.toLocaleString(locale)} {t("creditUnit")}</td><td className="px-5 py-4 text-right text-on-surface-variant">{formatDate(item.created_at)}</td></tr>)}</tbody></table></div>}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4"><h2 className="font-geist text-3xl font-semibold tracking-tight">{t("orders")}</h2><Link href="/dashboard/billing/orders" className="text-sm font-semibold text-primary underline decoration-outline-variant underline-offset-4 transition hover:decoration-primary">{t("viewAllOrders")}</Link></div>
        <div className="mt-6 border-t border-outline-variant/50">
          {data.orders.length === 0 ? <p className="border-b border-outline-variant/50 py-10 text-sm text-on-surface-variant">{t("emptyOrders")}</p> : data.orders.map((order) => <div key={order.id} className="grid gap-3 border-b border-outline-variant/50 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-geist text-lg font-semibold tabular-nums">{order.amount_vnd.toLocaleString(locale)} VND</p><p className="mt-1 text-xs text-on-surface-variant">{formatDate(order.created_at)} · {order.purpose === "creator_slots" ? `${order.skill_slots} ${locale === "vi" ? "slot skill" : "skill slots"}` : `${order.credit_units.toLocaleString(locale)} ${t("creditUnit")}`}</p></div><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">{order.status}</span></div>)}
        </div>
      </section>
    </>
  );
}
