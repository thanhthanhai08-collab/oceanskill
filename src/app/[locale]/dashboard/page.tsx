import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import DashboardStat from "@/components/dashboard/DashboardStat";
import {getDashboardOverview} from "@/lib/dashboard/data";
import {logout} from "./actions";

export const dynamic = "force-dynamic";

export interface DashboardPageProps {
  readonly params: Promise<{locale: string}>;
}

export default async function DashboardPage({params}: DashboardPageProps) {
  const {locale} = await params;
  const [t, common, data] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Common"),
    getDashboardOverview(),
  ]);

  if (!data) redirect(`/${locale}/login`);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));
  const creditGoal = Math.max(100, data.balance || 100);
  const creditProgress = Math.min(100, Math.round((data.balance / creditGoal) * 100));

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("eyebrow")}</p>
          <h1 className="mt-3 font-geist text-4xl font-bold tracking-tight">{t("overviewTitle")}</h1>
          <p className="mt-3 max-w-2xl text-on-surface-variant">{t("description")}</p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container">
            {common("logout")}
          </button>
        </form>
      </div>

      <section className="relative mt-9 overflow-hidden rounded-2xl border border-primary/30 bg-surface-container-low/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-8">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary/10 blur-[100px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">{t("roleLabel")}</span>
              <h2 className="font-geist text-2xl font-bold">{t("availableCredits")}</h2>
            </div>
            <p className="text-sm leading-6 text-on-surface-variant">{t("mcpCallsDescription")}</p>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-mono text-on-surface-variant">Credits usage</span>
                <span className="font-mono text-primary">{data.balance.toLocaleString(locale)} / {creditGoal.toLocaleString(locale)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_12px_rgba(184,195,255,0.45)]" style={{width: `${creditProgress}%`}} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-xl lg:min-w-[240px]">
            <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">{t("availableCredits")}</p>
            <p className="mt-2 font-geist text-5xl font-extrabold text-primary">{data.balance.toLocaleString(locale)}</p>
            <Link href="/dashboard/billing" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-[0_0_12px_rgba(184,195,255,0.28)] transition hover:brightness-110">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              {t("topUp")}
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat icon="deployed_code" label={t("skillsUploaded")} value={String(data.userSkillCount)} accent="secondary" />
        <DashboardStat icon="api" label={t("mcpCalls")} value={data.usageCount.toLocaleString(locale)} description={t("mcpCallsDescription")} accent="tertiary" />
        <DashboardStat icon="key" label={t("activeKeys")} value={String(data.activeKeyCount)} />
        <DashboardStat icon="receipt_long" label={t("ordersCount")} value={String(data.orders.length)} accent="secondary" />
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-geist text-2xl font-bold">{t("recentUsage")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tracking your AI skill execution and MCP keys.</p>
          </div>
          <Link href="/dashboard/usage" className="text-sm font-semibold text-primary transition hover:text-primary/70">{t("viewAllUsage")}</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
          {data.usage.length === 0 ? (
            <p className="p-8 text-sm text-on-surface-variant">{t("emptyUsage")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.04]">
                  <tr>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colTool")}</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colStatus")}</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Credits used</th>
                    <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("colDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.usage.map((item) => (
                    <tr key={item.id} className="transition hover:bg-white/[0.04]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded bg-surface-container-high text-primary"><span className="material-symbols-outlined text-[17px]">description</span></span>
                          <span className="font-semibold">{item.tool_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase ${item.status === "ok" ? "border-green-400/20 bg-green-400/10 text-green-300" : "border-error/30 bg-error/10 text-error"}`}>{item.status}</span></td>
                      <td className="px-6 py-4 text-on-surface-variant">{item.units.toLocaleString(locale)} credits</td>
                      <td className="px-6 py-4 text-right text-on-surface-variant">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-secondary">receipt_long</span>{t("orders")}</h2>
          <Link href="/dashboard/billing/orders" className="text-sm font-semibold text-primary transition hover:text-primary/70">{t("viewAllOrders")}</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.orders.length === 0 ? (
            <p className="col-span-2 rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">{t("emptyOrders")}</p>
          ) : (
            data.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl bg-surface-container p-4">
                <div>
                  <p className="font-semibold">{order.amount_vnd.toLocaleString(locale)} VND</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{formatDate(order.created_at)} - {order.credit_units.toLocaleString(locale)} credits</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase text-primary">{order.status}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
