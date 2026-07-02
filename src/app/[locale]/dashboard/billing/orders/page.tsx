import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingOrdersPage({params}: {readonly params: Promise<{locale: string}>}) {
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
      .order("created_at", {ascending: false}),
  ]);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "long", timeStyle: "short"}).format(new Date(v));

  const statusColor = (status: string) => {
    if (status === "paid") return "bg-tertiary/10 text-tertiary";
    if (status === "expired" || status === "failed") return "bg-error/10 text-error";
    return "bg-surface-container-high text-on-surface-variant";
  };

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("billingEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("billingOrders")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("ordersDescription")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        {!orders || orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-sm text-on-surface-variant">
            {t("emptyOrders")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-left">
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colOrderCode")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colAmount")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colCredits")}</th>
                  <th className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colStatus")}</th>
                  <th className="pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{t("colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant/20 last:border-b-0">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs">{order.order_code ?? order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{Number(order.amount_vnd).toLocaleString(locale)} ₫</td>
                    <td className="py-3 pr-4 text-tertiary font-semibold">+{Number(order.credit_units).toLocaleString(locale)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-on-surface-variant">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
