"use client";

import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";
import {navItems} from "@/data/mockData";

export interface HeaderNavProps { readonly mobile?: boolean; }

export default function HeaderNav({mobile = false}: HeaderNavProps) {
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  return (
    <nav aria-label={t("mainLabel")} className={mobile ? "flex gap-2 overflow-x-auto border-t border-outline-variant/30 px-4 py-3 md:hidden" : "hidden items-center gap-1 md:flex"}>
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
