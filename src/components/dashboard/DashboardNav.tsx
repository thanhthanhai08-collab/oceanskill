"use client";

import {usePathname} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {dashboardNavItems} from "@/data/mockData";

export type DashboardNavLabels = Readonly<Record<(typeof dashboardNavItems)[number]["label"], string>>;

export default function DashboardNav({labels, locale, onNavigate}: {readonly labels: DashboardNavLabels; readonly locale: string; readonly onNavigate?: () => void}) {
  const pathname = usePathname();
  const normalized = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const isActive = (href: string) => href === "/dashboard" ? normalized === "/dashboard" || normalized === "/dashboard/" : normalized.startsWith(href);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Dashboard">
      {dashboardNavItems.map((item) => {
        const active = isActive(item.href);
        return <Link key={item.label} href={item.href as "/dashboard"} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`relative flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition lg:w-full ${active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}><span className="material-symbols-outlined text-[19px]">{item.icon}</span><span>{labels[item.label]}</span>{active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-primary lg:block" />}</Link>;
      })}
    </nav>
  );
}
