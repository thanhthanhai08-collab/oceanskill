import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {getDashboardProfile} from "@/lib/dashboard/profile";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CREDIT_PACKS = [
  {id: "starter", credits: 1000, priceVnd: 50000, popular: false},
  {id: "growth", credits: 5000, priceVnd: 200000, popular: true},
  {id: "pro", credits: 15000, priceVnd: 500000, popular: false},
] as const;

export default async function BillingOverviewPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, profileData] = await Promise.all([
    getTranslations("Dashboard"),
    getDashboardProfile(),
  ]);

  if (!profileData) redirect(`/${locale}/login`);

  // Fetch recent orders for the overview
  const supabase = await createClient();
  const {data: recentOrders} = await supabase
    .from("payment_orders")
    .select("id,status,amount_vnd,credit_units,created_at")
    .eq("user_id", String(profileData.claims?.sub))
    .order("created_at", {ascending: false})
    .limit(3);

  const formatDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(v));

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("billingEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("billingOverview")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("billingDescription")}</p>
      </header>

      {/* Credit balance hero */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-container via-[#4937c8] to-secondary-container p-7 text-white shadow-[0_0_35px_rgba(46,91,255,.18)] sm:p-9">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/75">{t("availableCredits")}</p>
        <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <p className="font-geist text-5xl font-bold">{profileData.balance.toLocaleString(locale)}</p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              {t("freePlan")}
            </span>
          </div>
        </div>
      </div>

      {/* Credit packs */}
      <section className="mt-8">
        <h2 className="font-geist text-2xl font-semibold">{t("buyCreditTitle")}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{t("buyCreditDescription")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl border p-6 transition hover:shadow-lg ${
                pack.popular
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(46,91,255,.12)]"
                  : "border-outline-variant/40 bg-surface-container-low/65"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 font-mono text-[10px] text-on-primary">
                  {t("popular")}
                </span>
              )}
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{pack.id}</p>
              <p className="mt-3 font-geist text-3xl font-bold">{pack.credits.toLocaleString(locale)}</p>
              <p className="text-sm text-on-surface-variant">{t("credits")}</p>
              <p className="mt-4 font-geist text-xl font-semibold">{pack.priceVnd.toLocaleString(locale)} ₫</p>
              <button
                type="button"
                disabled
                className={`mt-5 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  pack.popular ? "bg-primary text-on-primary hover:bg-primary/90" : "border border-outline-variant/50 hover:bg-surface-container"
                }`}
              >
                {t("buyNow")} <span className="text-[10px] opacity-70">(coming soon)</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      {(recentOrders ?? []).length > 0 && (
        <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
          <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
            <span className="material-symbols-outlined text-secondary">receipt_long</span>
            {t("recentOrders")}
          </h2>
          <div className="mt-5 space-y-3">
            {(recentOrders ?? []).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl bg-surface-container p-4">
                <div>
                  <p className="font-semibold">{Number(order.amount_vnd).toLocaleString(locale)} ₫</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatDate(order.created_at)} · {Number(order.credit_units).toLocaleString(locale)} credits
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase text-primary">{order.status}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/billing/orders" className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/70">
            {t("viewAllOrders")}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </section>
      )}
    </>
  );
}
