import type {DashboardNavLabels} from "@/components/dashboard/DashboardNav";
import DashboardNav from "@/components/dashboard/DashboardNav";
import {Link} from "@/i18n/navigation";

export interface DashboardSidebarProps {
  readonly displayName: string;
  readonly roleLabel: string;
  readonly balance: number;
  readonly locale: string;
  readonly labels: DashboardNavLabels & {creditBalance: string; topUp: string};
}

export default function DashboardSidebar({displayName, roleLabel, balance, locale, labels}: DashboardSidebarProps) {
  const navLabels: DashboardNavLabels = {
    overview: labels.overview,
    skills: labels.skills,
    apiKeys: labels.apiKeys,
    usage: labels.usage,
    billing: labels.billing,
    settings: labels.settings,
  };

  return (
    <aside className="h-fit rounded-2xl border border-outline-variant/45 bg-surface-container-low/70 p-5 lg:sticky lg:top-28">
      {/* User info */}
      <div className="border-b border-outline-variant/35 px-2 pb-5">
        <p className="font-geist text-xl font-semibold">{displayName}</p>
        <p className="mt-1 font-mono text-xs text-on-surface-variant">{roleLabel}</p>
      </div>

      {/* Credit balance mini-card */}
      <div className="mt-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-tertiary/10 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.creditBalance}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-geist text-2xl font-bold">{balance.toLocaleString(locale)}</p>
          <Link
            href="/dashboard/billing"
            className="rounded-lg bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/25"
          >
            {labels.topUp}
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <DashboardNav labels={navLabels} locale={locale} />
    </aside>
  );
}
