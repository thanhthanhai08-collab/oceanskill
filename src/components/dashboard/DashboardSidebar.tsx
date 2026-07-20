"use client";

import Image from "next/image";
import {useEffect, useState} from "react";
import type {DashboardNavLabels} from "@/components/dashboard/DashboardNav";
import DashboardNav from "@/components/dashboard/DashboardNav";

export interface DashboardSidebarProps {
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly balance: number;
  readonly locale: string;
  readonly labels: DashboardNavLabels & {creditBalance: string; topUp: string; logout: string; menuOpen: string; menuClose: string};
  readonly logoutAction: () => Promise<void>;
}

export default function DashboardSidebar({displayName, avatarUrl, balance, locale, labels, logoutAction}: DashboardSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLabels: DashboardNavLabels = {overview: labels.overview, skills: labels.skills, collections: labels.collections, mcpKeys: labels.mcpKeys, usage: labels.usage, billing: labels.billing, settings: labels.settings};

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);
  return (
    <aside className="scrollbar-hidden border-b border-outline-variant/45 bg-background py-5 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r lg:bg-background/90 lg:py-8 lg:pr-6 lg:backdrop-blur">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-3 lg:border-b lg:border-outline-variant/40 lg:pb-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-low">
              {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill unoptimized sizes="44px" className="object-cover" /> : <span className="material-symbols-outlined text-[21px] text-primary">person</span>}
            </span>
            <span className="min-w-0 truncate font-geist text-sm font-semibold">{displayName}</span>
          </div>
          <button type="button" aria-expanded={menuOpen} aria-controls="dashboard-mobile-menu" aria-label={menuOpen ? labels.menuClose : labels.menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface transition hover:border-primary/45 hover:text-primary lg:hidden">
            <span className="material-symbols-outlined text-[24px]">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
        <button type="button" aria-label={labels.menuClose} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className={`fixed inset-0 z-[70] bg-black/55 transition-opacity duration-200 lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} />
        <div id="dashboard-mobile-menu" role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen ? true : undefined} aria-label={labels.menuOpen} className={`scrollbar-hidden fixed inset-y-0 left-0 z-[80] flex w-[min(86vw,320px)] flex-col gap-5 overflow-y-auto overscroll-contain border-r border-outline-variant/50 bg-background p-5 shadow-2xl transition-[transform,visibility] duration-300 ease-out will-change-transform lg:static lg:z-auto lg:flex lg:min-h-0 lg:w-auto lg:flex-1 lg:translate-x-0 lg:overflow-visible lg:border-r-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:transition-none ${menuOpen ? "visible translate-x-0" : "invisible -translate-x-full pointer-events-none lg:visible lg:pointer-events-auto"}`}>
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-5 lg:hidden">
            <span className="truncate font-geist text-sm font-semibold">{displayName}</span>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label={labels.menuClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
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
