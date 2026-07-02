import {getTranslations} from "next-intl/server";
import {redirect, notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({params}: {readonly params: Promise<{locale: string; orderId: string}>}) {
  const {locale, orderId} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);

  const [t, {data: order}] = await Promise.all([
    getTranslations("Dashboard"),
    supabase.from("payment_orders")
      .select("id,order_code,status,amount_vnd,credit_units,created_at")
      .eq("id", orderId)
      .eq("user_id", String(userId))
      .single(),
  ]);

  if (!order) notFound();

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "long", timeStyle: "short"}).format(new Date(v));

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("billingEyebrow")}</p>
          <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("invoiceDetail")}</h1>
          <p className="mt-1 font-mono text-sm text-on-surface-variant">{order.order_code ?? order.id}</p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-xl border border-outline-variant/50 px-5 py-3 text-sm font-semibold transition hover:bg-surface-container disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {t("downloadPdf")} <span className="text-[10px] opacity-60">(coming soon)</span>
        </button>
      </header>

      {/* Invoice card */}
      <div className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-6 border-b border-outline-variant/30 pb-6">
          <div>
            <p className="font-geist text-2xl font-bold">OceanSkill</p>
            <p className="mt-1 text-sm text-on-surface-variant">oceanskill.io</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-on-surface-variant">{t("invoiceDate")}</p>
            <p className="mt-1 font-semibold">{formatDate(order.created_at)}</p>
            <span className="mt-2 inline-block rounded-full bg-tertiary/10 px-3 py-1 font-mono text-[10px] uppercase text-tertiary">
              {order.status}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-xl bg-surface-container p-4">
            <div>
              <p className="font-semibold">{t("creditPurchase")}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{Number(order.credit_units).toLocaleString(locale)} × 1 credit pack</p>
            </div>
            <p className="font-geist text-xl font-bold">{Number(order.amount_vnd).toLocaleString(locale)} ₫</p>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 flex justify-end border-t border-outline-variant/30 pt-5">
          <div className="text-right">
            <p className="text-sm text-on-surface-variant">{t("total")}</p>
            <p className="mt-1 font-geist text-3xl font-bold">{Number(order.amount_vnd).toLocaleString(locale)} ₫</p>
          </div>
        </div>

        {/* Note */}
        <p className="mt-6 text-xs leading-5 text-on-surface-variant">{t("invoiceNote")}</p>
      </div>
    </>
  );
}
