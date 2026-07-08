import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function BillingLayout({children, params}: {readonly children: ReactNode; readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations("Dashboard");

  const tabs = [
    {href: `/${locale}/dashboard/billing`, label: t("billingOverview"), icon: "account_balance_wallet"},
    {href: `/${locale}/dashboard/billing/topup`, label: t("billingTopup"), icon: "add_card"},
    {href: `/${locale}/dashboard/billing/orders`, label: t("billingOrders"), icon: "receipt_long"},
    {href: `/${locale}/dashboard/billing/invoices`, label: t("billingInvoices"), icon: "description"},
    {href: `/${locale}/dashboard/billing/ledger`, label: t("billingLedger"), icon: "menu_book"},
  ] as const;

  return (
    <>
      {/* Billing sub-nav */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-outline-variant/30 pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href as "/dashboard/billing"}
            className="flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </>
  );
}
