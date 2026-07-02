import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingInvoicesPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);

  const [t, {data: orders}] = await Promise.all([
    getTranslations("Dashboard"),
    supabase.from("payment_orders")
      .select("id,order_code,status,amount_vnd,credit_units,created_at")
      .eq("user_id", String(userId))
      .eq("status", "paid")
      .order("created_at", {ascending: false}),
  ]);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "long"}).format(new Date(v));

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("billingEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("billingInvoices")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("invoicesDescription")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        {!orders || orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-sm text-on-surface-variant">
            {t("emptyInvoices")}
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 rounded-xl bg-surface-container p-4">
                <div>
                  <p className="font-semibold">{t("invoiceFor")} {Number(order.amount_vnd).toLocaleString(locale)} ₫</p>
                  <p className="mt-0.5 font-mono text-xs text-on-surface-variant">{order.order_code ?? order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{formatDate(order.created_at)} · {Number(order.credit_units).toLocaleString(locale)} credits</p>
                </div>
                <Link
                  href={`/dashboard/billing/invoices/${order.id}` as "/dashboard"}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-outline-variant/40 px-4 py-2 text-xs font-semibold transition hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  {t("viewInvoice")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
