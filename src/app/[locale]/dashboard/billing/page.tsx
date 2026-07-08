import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";
import CreatePaymentOrderButton from "@/components/dashboard/CreatePaymentOrderButton";
import {getDashboardProfile} from "@/lib/dashboard/profile";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CreditPack = {
  id: string;
  code: string;
  name: string;
  price_vnd: number;
  credit_units: number;
};

const PACK_STYLE: Record<string, {icon: string; accent: "primary" | "secondary" | "tertiary"; popular?: boolean}> = {
  starter_20k: {icon: "bolt", accent: "primary"},
  builder_50k: {icon: "rocket_launch", accent: "secondary", popular: true},
  power_100k: {icon: "rocket", accent: "tertiary"},
};

const copy = {
  vi: {
    buyCredits: "Mua Credit",
    promo: "Ưu đãi hôm nay",
    popular: "Phổ biến nhất",
    choose: "Chọn gói",
    creating: "Đang tạo lệnh...",
    error: "Không thể tạo lệnh thanh toán. Hãy thử lại.",
    noExpiry: "Credit không hết hạn",
    mcpReady: "Dùng ngay cho MCP và kho skill",
    autoOrder: "Tạo QR thanh toán SePay tự động",
    emptyPacks: "Chưa có gói credit nào đang hoạt động.",
    creditLabel: "Credits",
    scrollTopUp: "Nạp credit",
    transactionHistory: "Lịch sử giao dịch",
    colDate: "Ngày nạp/mua",
    colType: "Loại giao dịch",
    colUnits: "Số lượng",
    colAmount: "Số tiền",
    colStatus: "Trạng thái",
    topUpType: "Nạp tiền",
  },
  en: {
    buyCredits: "Buy credits",
    promo: "Today offer",
    popular: "Most popular",
    choose: "Choose pack",
    creating: "Creating order...",
    error: "Could not create payment order. Please try again.",
    noExpiry: "Credits do not expire",
    mcpReady: "Ready for MCP and skill library",
    autoOrder: "Automatic SePay QR payment order",
    emptyPacks: "No active credit packs yet.",
    creditLabel: "Credits",
    scrollTopUp: "Top up",
    transactionHistory: "Transaction history",
    colDate: "Date",
    colType: "Transaction type",
    colUnits: "Amount",
    colAmount: "Payment",
    colStatus: "Status",
    topUpType: "Top up",
  },
} as const;

export default async function BillingOverviewPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, profileData] = await Promise.all([
    getTranslations("Dashboard"),
    getDashboardProfile(),
  ]);

  if (!profileData) redirect(`/${locale}/login`);

  const supabase = await createClient();
  const [{data: recentOrders}, {data: creditPacks}] = await Promise.all([
    supabase
      .from("payment_orders")
      .select("id,status,amount_vnd,credit_units,created_at")
      .eq("user_id", String(profileData.claims?.sub))
      .order("created_at", {ascending: false})
      .limit(5),
    supabase
      .from("credit_packs")
      .select("id,code,name,price_vnd,credit_units")
      .eq("active", true)
      .order("price_vnd", {ascending: true}),
  ]);

  const labels = locale === "vi" ? copy.vi : copy.en;
  const packs = (creditPacks ?? []) as CreditPack[];
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
              <span className="mb-2 text-xl font-semibold text-white/55">{labels.creditLabel}</span>
            </p>
          </div>
          <a href="#credit-packs" className="inline-flex min-h-16 items-center justify-center gap-3 rounded-xl bg-white/70 px-10 py-4 font-bold text-primary-container transition hover:bg-white">
            <span className="material-symbols-outlined">add_circle</span>
            {labels.scrollTopUp}
          </a>
        </div>
      </div>

      <section id="credit-packs" className="mt-12 scroll-mt-28">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-geist text-3xl font-bold">{labels.buyCredits}</h2>
          <span className="rounded-full bg-tertiary/10 px-4 py-1.5 font-mono text-xs font-bold text-tertiary">{labels.promo}</span>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {packs.length ? packs.map((pack) => {
            const style = PACK_STYLE[pack.code] ?? {icon: "paid", accent: "primary" as const};
            const isPopular = Boolean(style.popular);
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl border p-7 transition hover:-translate-y-1 ${
                  isPopular
                    ? "z-10 border-white/20 bg-gradient-to-br from-primary/65 via-secondary/75 to-tertiary/80 shadow-[0_24px_70px_rgba(147,51,234,0.28)] lg:-mt-3 lg:scale-105"
                    : "border-white/10 bg-surface-container-low/55"
                }`}
              >
                {isPopular && <span className="absolute right-7 top-7 rounded-lg bg-white/10 px-3 py-1 font-mono text-[10px] font-bold text-white/80">{labels.popular}</span>}
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${isPopular ? "bg-white/15 text-white" : style.accent === "tertiary" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                  <span className="material-symbols-outlined text-3xl">{style.icon}</span>
                </div>
                <p className="mt-8 text-sm font-semibold text-on-surface-variant">{pack.name}</p>
                <p className="mt-3 font-geist text-3xl font-bold">{Number(pack.credit_units).toLocaleString(locale)} {labels.creditLabel}</p>
                <p className={`mt-1 font-geist text-xl font-bold ${style.accent === "tertiary" ? "text-tertiary" : isPopular ? "text-white" : "text-primary"}`}>
                  {formatVnd(Number(pack.price_vnd))}
                </p>
                <ul className="mt-7 space-y-3 text-sm text-on-surface-variant">
                  {[labels.noExpiry, labels.mcpReady, labels.autoOrder].map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-primary">check</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <CreatePaymentOrderButton
                  packId={pack.id}
                  locale={locale}
                  loadingLabel={labels.creating}
                  errorLabel={labels.error}
                  className={`mt-9 w-full rounded-xl py-3 text-sm font-bold transition disabled:cursor-wait disabled:opacity-70 ${isPopular ? "bg-white/75 text-primary-container hover:bg-white" : "border border-primary/40 text-primary hover:bg-primary/10"}`}
                >
                  {labels.choose}
                </CreatePaymentOrderButton>
              </div>
            );
          }) : (
            <p className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-sm text-on-surface-variant lg:col-span-3">{labels.emptyPacks}</p>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-white/10 bg-surface-container-low/55">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 p-6">
          <h2 className="font-geist text-3xl font-bold">{labels.transactionHistory}</h2>
          <Link href="/dashboard/billing/orders" className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/70">
            {t("viewAllOrders")}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-high/45 text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">{labels.colDate}</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">{labels.colType}</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">{labels.colUnits}</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">{labels.colAmount}</th>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-wider">{labels.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(recentOrders ?? []).length ? (recentOrders ?? []).map((order) => (
                <tr key={order.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-6 py-5 text-sm font-semibold">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{labels.topUpType}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-primary">+{Number(order.credit_units).toLocaleString(locale)} {labels.creditLabel}</td>
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
