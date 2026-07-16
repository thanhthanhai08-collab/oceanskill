"use client";

import {usePathname} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {dashboardNavItems} from "@/data/mockData";

export type DashboardNavLabels = Readonly<Record<(typeof dashboardNavItems)[number]["label"], string>>;

export default function DashboardNav({labels, locale}: {readonly labels: DashboardNavLabels; readonly locale: string}) {
  const pathname = usePathname();
  const normalized = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const isActive = (href: string) => href === "/dashboard" ? normalized === "/dashboard" || normalized === "/dashboard/" : normalized.startsWith(href);

  return (
    <nav className="flex gap-x-1 overflow-x-auto" aria-label="Dashboard">
      {dashboardNavItems.map((item) => {
        const active = isActive(item.href);
        return <Link key={item.label} href={item.href as "/dashboard"} aria-current={active ? "page" : undefined} className={`relative flex min-h-11 shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition ${active ? "text-primary after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-primary" : "text-on-surface-variant hover:text-on-surface"}`}><span className="material-symbols-outlined text-[18px]">{item.icon}</span><span>{labels[item.label]}</span></Link>;
      })}
    </nav>
  );
}
