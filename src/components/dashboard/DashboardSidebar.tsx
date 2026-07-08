import type {DashboardNavLabels} from "@/components/dashboard/DashboardNav";
import DashboardNav from "@/components/dashboard/DashboardNav";

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
    collections: labels.collections,
    mcpKeys: labels.mcpKeys,
    usage: labels.usage,
    billing: labels.billing,
    settings: labels.settings,
  };

  return (
    <aside className="h-fit rounded-2xl border border-white/5 bg-surface-container-lowest/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:sticky lg:top-24 lg:min-h-[calc(100vh-7rem)]">
      {/* User info */}
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
          <span className="material-symbols-outlined text-[21px] text-primary">person</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] font-bold">{displayName}</p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">{roleLabel}</p>
        </div>
      </div>

      {/* Credit balance mini-card */}
      <div className="mt-3 rounded-lg border border-white/10 bg-gradient-to-br from-surface-container-low via-surface-container-low to-primary/10 px-4 py-3 shadow-[0_0_24px_rgba(46,91,255,0.08)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.creditBalance}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-geist text-2xl font-bold">{balance.toLocaleString(locale)}</p>
          <a
            href={`/${locale}/dashboard/billing/topup`}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 text-[11px] font-bold text-primary shadow-[0_0_18px_rgba(46,91,255,0.12)] transition hover:bg-primary hover:text-on-primary"
          >
            <span className="material-symbols-outlined text-[14px]">add_circle</span>
            {labels.topUp}
          </a>
        </div>
      </div>

      {/* Navigation */}
      <DashboardNav labels={navLabels} locale={locale} />
    </aside>
  );
}
