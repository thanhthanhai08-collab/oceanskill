import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {getDashboardProfile} from "@/lib/dashboard/profile";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CREDIT_PACKS = [
  {id: "core", name: "Gói Cơ Bản", credits: 50, priceVnd: 50000, icon: "bolt", accent: "primary", popular: false, perks: ["Truy cập tất cả skill", "Không hết hạn"]},
  {id: "growth", name: "Gói Tăng Trưởng", credits: 100, priceVnd: 100000, icon: "rocket_launch", accent: "secondary", popular: true, perks: ["Mọi tính năng Gói Cơ Bản", "Hỗ trợ ưu tiên 24/7"]},
  {id: "pro", name: "Gói Pro", credits: 500, priceVnd: 450000, originalPriceVnd: 500000, icon: "rocket", accent: "tertiary", popular: false, perks: ["Tiết kiệm 10% chi phí", "Quà tặng MCP key giới hạn"]},
] as const;

export default async function BillingOverviewPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, profileData] = await Promise.all([
    getTranslations("Dashboard"),
    getDashboardProfile(),
  ]);

  if (!profileData) redirect(`/${locale}/login`);

  const supabase = await createClient();
  const {data: recentOrders} = await supabase
    .from("payment_orders")
    .select("id,status,amount_vnd,credit_units,created_at")
    .eq("user_id", String(profileData.claims?.sub))
    .order("created_at", {ascending: false})
    .limit(5);

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));
  const formatVnd = (value: number) => `${value.toLocaleString(locale)} VND`;

  return (
    <>
      <header>
        <h1 className="font-geist text-4xl font-bold tracking-tight">{t("billing")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("billingDescription")}</p>
      </header>

      <div className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/80 via-secondary/80 to-tertiary/90 p-8 text-on-primary shadow-[0_0_48px_rgba(147,51,234,0.22)] sm:p-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-white/55">{t("availableCredits")}</p>
            <p className="mt-2 flex items-end gap-3 font-geist text-6xl font-bold leading-none">
              {profileData.balance.toLocaleString(locale)}
              <span className="mb-2 text-xl font-semibold text-white/55">Credits</span>
            </p>
          </div>
          <button type="button" className="inline-flex min-h-16 items-center justify-center gap-3 rounded-xl bg-white/70 px-10 py-4 font-bold text-primary-container transition hover:bg-white">
            <span className="material-symbols-outlined">add_circle</span>
            {t("topUp")}
          </button>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-geist text-3xl font-bold">Mua Credit</h2>
          <span className="rounded-full bg-tertiary/10 px-4 py-1.5 font-mono text-xs font-bold text-tertiary">Ưu đãi hôm nay -10%</span>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl border p-7 transition hover:-translate-y-1 ${
                pack.popular
                  ? "z-10 border-white/20 bg-gradient-to-br from-primary/65 via-secondary/75 to-tertiary/80 shadow-[0_24px_70px_rgba(147,51,234,0.28)] lg:-mt-3 lg:scale-105"
                  : "border-white/10 bg-surface-container-low/55"
              }`}
            >
              {pack.popular && <span className="absolute right-7 top-7 rounded-lg bg-white/10 px-3 py-1 font-mono text-[10px] font-bold text-white/80">Phổ biến nhất</span>}
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${pack.popular ? "bg-white/15 text-white" : pack.accent === "tertiary" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                <span className="material-symbols-outlined text-3xl">{pack.icon}</span>
              </div>
              <p className="mt-8 text-sm font-semibold text-on-surface-variant">{pack.name}</p>
              <p className="mt-3 font-geist text-3xl font-bold">{pack.credits.toLocaleString(locale)} Credits</p>
              <div className="mt-1 flex items-center gap-2">
                <p className={`font-geist text-xl font-bold ${pack.accent === "tertiary" ? "text-tertiary" : pack.popular ? "text-white" : "text-primary"}`}>{formatVnd(pack.priceVnd)}</p>
                {"originalPriceVnd" in pack && <p className="text-sm text-error line-through">{formatVnd(pack.originalPriceVnd)}</p>}
              </div>
              <ul className="mt-7 space-y-3 text-sm text-on-surface-variant">
                {pack.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-primary">check</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <button type="button" disabled className={`mt-9 w-full rounded-xl py-3 text-sm font-bold transition disabled:opacity-80 ${pack.popular ? "bg-white/75 text-primary-container" : "border border-primary/40 text-primary hover:bg-primary/10"}`}>
                Chọn gói
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-white/10 bg-surface-container-low/55">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 p-6">
          <h2 className="font-geist text-3xl font-bold">Lịch sử giao dịch</h2>
          <Link href="/dashboard/billing/orders" className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/70">
            {t("viewAllOrders")}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-high/45 text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">Ngày nạp/mua</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">Loại giao dịch</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(recentOrders ?? []).length ? (recentOrders ?? []).map((order) => (
                <tr key={order.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-6 py-5 text-sm font-semibold">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">Nạp tiền</td>
                  <td className="px-6 py-5 text-sm font-semibold text-primary">+{Number(order.credit_units).toLocaleString(locale)} Credits</td>
                  <td className="px-6 py-5 text-sm font-semibold">{formatVnd(Number(order.amount_vnd))}</td>
                  <td className="px-6 py-5"><span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary">{order.status}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">{t("emptyOrders")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
