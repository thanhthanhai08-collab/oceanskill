import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getUsageEvents} from "@/lib/usage/events";

export const dynamic = "force-dynamic";

export default async function UsagePage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, data] = await Promise.all([
    getTranslations("Dashboard"),
    getUsageEvents({limit: 50}),
  ]);

  if (!data) redirect(`/${locale}/login`);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(v));

  const statusColor = (status: string) => {
    if (status === "ok") return "bg-tertiary/10 text-tertiary";
    if (status === "error") return "bg-error/10 text-error";
    return "bg-surface-container-high text-on-surface-variant";
  };

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("usageEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("usageTitle")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("usageDescription")}</p>
      </header>

      {/* Summary stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{t("totalCalls")}</p>
          <p className="mt-4 font-geist text-3xl font-bold">{data.total.toLocaleString(locale)}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{t("totalUnits")}</p>
          <p className="mt-4 font-geist text-3xl font-bold text-tertiary">
            {data.events.reduce((sum, e) => sum + e.units, 0).toLocaleString(locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{t("showingEvents")}</p>
          <p className="mt-4 font-geist text-3xl font-bold text-secondary">{data.events.length}</p>
        </div>
      </div>

      {/* Events table */}
      <section className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-tertiary">monitoring</span>
          {t("usageHistory")}
        </h2>

        {data.events.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
            {t("emptyUsage")}
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-left">
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colTool")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colUnits")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colStatus")}</th>
                  <th className="pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr key={event.id} className="border-b border-outline-variant/20 last:border-b-0">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs">{event.tool_name}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-geist font-semibold text-tertiary">-{event.units}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${statusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-on-surface-variant">{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.total > 50 && (
          <p className="mt-4 text-xs text-on-surface-variant">{t("usagePaginationHint", {total: data.total})}</p>
        )}
      </section>
    </>
  );
}
