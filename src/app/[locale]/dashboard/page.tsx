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

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(v));

  return (
    <>
      {/* Header */}
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

      {/* Stats */}
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        <DashboardStat icon="key" label={t("activeKeys")} value={String(data.activeKeyCount)} />
        <DashboardStat icon="bolt" label={t("mcpCalls")} value={data.usageCount.toLocaleString(locale)} description={t("mcpCallsDescription")} accent="tertiary" />
        <DashboardStat icon="deployed_code" label={t("skillsUploaded")} value={String(data.userSkillCount)} accent="secondary" />
      </div>

      {/* Recent usage */}
      <section className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-tertiary">monitoring</span>
          {t("recentUsage")}
        </h2>
        <div className="mt-5 space-y-2">
          {data.usage.length === 0 ? (
            <p className="rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
              {t("emptyUsage")}
            </p>
          ) : (
            data.usage.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border-b border-outline-variant/20 px-1 py-3 last:border-b-0">
                <div>
                  <p className="font-mono text-xs">{item.tool_name}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{formatDate(item.created_at)}</p>
                </div>
                <span className={`font-geist font-semibold ${item.status === "ok" ? "text-secondary" : "text-error"}`}>
                  -{item.units}
                </span>
              </div>
            ))
          )}
        </div>
        {data.usage.length > 0 && (
          <Link href="/dashboard/usage" className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/70">
            {t("viewAllUsage")}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        )}
      </section>

      {/* Recent orders */}
      <section className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-secondary">receipt_long</span>
          {t("orders")}
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.orders.length === 0 ? (
            <p className="col-span-2 rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
              {t("emptyOrders")}
            </p>
          ) : (
            data.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl bg-surface-container p-4">
                <div>
                  <p className="font-semibold">{order.amount_vnd.toLocaleString(locale)} ₫</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatDate(order.created_at)} · {order.credit_units.toLocaleString(locale)} credits
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase text-primary">
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>
        {data.orders.length > 0 && (
          <Link href="/dashboard/billing/orders" className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/70">
            {t("viewAllOrders")}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        )}
      </section>
    </>
  );
}
