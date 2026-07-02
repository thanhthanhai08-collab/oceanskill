"use client";

import {usePathname} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {dashboardNavItems} from "@/data/mockData";

export type DashboardNavLabels = Readonly<Record<(typeof dashboardNavItems)[number]["label"], string>>;

export default function DashboardNav({labels, locale}: {readonly labels: DashboardNavLabels; readonly locale: string}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Strip locale prefix for comparison: "/en/dashboard/skills" → "/dashboard/skills"
    const normalized = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    if (href === "/dashboard") return normalized === "/dashboard" || normalized === "/dashboard/";
    return normalized.startsWith(href);
  };

  return (
    <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
      {dashboardNavItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href as "/dashboard"}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-3 text-sm transition hover:bg-surface-container sm:gap-3 ${
              active ? "bg-primary/10 text-primary" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="truncate">{labels[item.label]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
