"use client";

import Image from "next/image";
import {useState} from "react";
import type {DashboardNavLabels} from "@/components/dashboard/DashboardNav";
import DashboardNav from "@/components/dashboard/DashboardNav";

export interface DashboardSidebarProps {
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly roleLabel: string;
  readonly balance: number;
  readonly locale: string;
  readonly labels: DashboardNavLabels & {creditBalance: string; topUp: string; logout: string; menuOpen: string; menuClose: string};
  readonly logoutAction: () => Promise<void>;
}

export default function DashboardSidebar({displayName, avatarUrl, roleLabel, balance, locale, labels, logoutAction}: DashboardSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLabels: DashboardNavLabels = {overview: labels.overview, skills: labels.skills, collections: labels.collections, mcpKeys: labels.mcpKeys, usage: labels.usage, billing: labels.billing, settings: labels.settings};
  return (
    <aside className="border-b border-outline-variant/45 bg-background/90 py-5 backdrop-blur lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] lg:border-b-0 lg:border-r lg:py-8 lg:pr-6">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-3 lg:border-b lg:border-outline-variant/40 lg:pb-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-low">
              {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill unoptimized sizes="44px" className="object-cover" /> : <span className="material-symbols-outlined text-[21px] text-primary">person</span>}
            </span>
            <span className="min-w-0"><span className="block truncate font-geist text-sm font-semibold">{displayName}</span><span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">{roleLabel}</span></span>
          </div>
          <button type="button" aria-expanded={menuOpen} aria-controls="dashboard-mobile-menu" aria-label={menuOpen ? labels.menuClose : labels.menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface transition hover:border-primary/45 hover:text-primary lg:hidden">
            <span className="material-symbols-outlined text-[24px]">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
        <div id="dashboard-mobile-menu" className={`${menuOpen ? "flex" : "hidden"} flex-col gap-5 border-t border-outline-variant/40 pt-4 lg:flex lg:min-h-0 lg:flex-1 lg:border-t-0 lg:pt-0`}>
          <DashboardNav labels={navLabels} locale={locale} onNavigate={() => setMenuOpen(false)} />
          <div className="flex flex-wrap items-center gap-3 lg:mt-auto lg:block lg:rounded-2xl lg:border lg:border-outline-variant/40 lg:bg-surface-container-low/60 lg:p-4">
            <div className="border-r border-outline-variant/50 pr-4 lg:border-r-0 lg:pr-0"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.creditBalance}</p><p className="mt-1 font-geist text-2xl font-semibold tabular-nums text-primary">{balance.toLocaleString(locale)}</p></div>
            <a href={`/${locale}/dashboard/billing/topup`} onClick={() => setMenuOpen(false)} className="btn-payment inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:brightness-105 lg:mt-4 lg:w-full"><span className="material-symbols-outlined text-[16px]">add</span>{labels.topUp}</a>
            <form action={logoutAction} className="lg:mt-2"><button className="inline-flex min-h-10 items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:text-red-600 dark:hover:text-red-300 lg:w-full lg:justify-center"><span className="material-symbols-outlined text-[17px]">logout</span>{labels.logout}</button></form>
          </div>
        </div>
      </div>
    </aside>
  );
}
