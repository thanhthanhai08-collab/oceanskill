import Image from "next/image";
import type {DashboardNavLabels} from "@/components/dashboard/DashboardNav";
import DashboardNav from "@/components/dashboard/DashboardNav";

export interface DashboardSidebarProps {
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly roleLabel: string;
  readonly balance: number;
  readonly locale: string;
  readonly labels: DashboardNavLabels & {creditBalance: string; topUp: string; logout: string};
  readonly logoutAction: () => Promise<void>;
}

export default function DashboardSidebar({displayName, avatarUrl, roleLabel, balance, locale, labels, logoutAction}: DashboardSidebarProps) {
  const navLabels: DashboardNavLabels = {overview: labels.overview, skills: labels.skills, collections: labels.collections, mcpKeys: labels.mcpKeys, usage: labels.usage, billing: labels.billing, settings: labels.settings};
  return (
    <aside className="border-b border-outline-variant/55 bg-background/90 pt-5 backdrop-blur lg:sticky lg:top-16 lg:z-30">
      <div className="flex flex-col gap-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-low">
            {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill unoptimized sizes="40px" className="object-cover" /> : <span className="material-symbols-outlined text-[21px] text-primary">person</span>}
          </span>
          <span className="min-w-0"><span className="block truncate font-geist text-sm font-semibold">{displayName}</span><span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">{roleLabel}</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-r border-outline-variant/50 pr-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.creditBalance}</p><p className="mt-1 font-geist text-xl font-semibold tabular-nums text-primary">{balance.toLocaleString(locale)}</p></div>
          <a href={`/${locale}/dashboard/billing/topup`} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary-container px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"><span className="material-symbols-outlined text-[16px]">add</span>{labels.topUp}</a>
          <form action={logoutAction}><button className="inline-flex min-h-10 items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:text-red-600 dark:hover:text-red-300"><span className="material-symbols-outlined text-[17px]">logout</span>{labels.logout}</button></form>
        </div>
      </div>
      <DashboardNav labels={navLabels} locale={locale} />
    </aside>
  );
}
