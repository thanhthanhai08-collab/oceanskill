import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {formatBillingDate} from "@/lib/billing/formatters";

export const dynamic = "force-dynamic";

export default async function BillingLedgerPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);

  const [t, ledgerResult] = await Promise.all([
    getTranslations("Dashboard"),
    // Query credit_ledger table – gracefully handles if table doesn't exist yet
    supabase.from("credit_ledger")
      .select("id,type,delta,balance_after,description,created_at")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false})
      .limit(100),
  ]);

  const entries = ledgerResult.data ?? [];
  const hasTable = !ledgerResult.error;
  const formatDate = (v: string) => formatBillingDate(locale, v);

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("billingEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("billingLedger")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("ledgerDescription")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        {!hasTable ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant/40 p-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">menu_book</span>
            <p className="font-geist text-lg font-semibold">{t("ledgerComingSoon")}</p>
            <p className="text-sm text-on-surface-variant">{t("ledgerComingSoonDescription")}</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-sm text-on-surface-variant">
            {t("emptyLedger")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-left">
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colType")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colDelta")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colBalance")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colDescription")}</th>
                  <th className="pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isCredit = Number(entry.delta) > 0;
                  return (
                    <tr key={entry.id} className="border-b border-outline-variant/20 last:border-b-0">
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${isCredit ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className={`py-3 pr-4 font-geist font-bold ${isCredit ? "text-tertiary" : "text-error"}`}>
                        {isCredit ? "+" : ""}{Number(entry.delta).toLocaleString(locale)}
                      </td>
                      <td className="py-3 pr-4 font-semibold">{Number(entry.balance_after).toLocaleString(locale)}</td>
                      <td className="py-3 pr-4 text-xs text-on-surface-variant">{entry.description ?? "–"}</td>
                      <td className="py-3 text-xs text-on-surface-variant">{formatDate(entry.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
