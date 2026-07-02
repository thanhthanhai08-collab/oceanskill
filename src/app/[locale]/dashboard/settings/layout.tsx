import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function SettingsLayout({children, params}: {readonly children: ReactNode; readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations("Dashboard");

  const tabs = [
    {href: `/${locale}/dashboard/settings`, label: t("settingsAccount"), icon: "manage_accounts"},
    {href: `/${locale}/dashboard/settings/security`, label: t("settingsSecurity"), icon: "shield_lock"},
    {href: `/${locale}/dashboard/settings/notifications`, label: t("settingsNotifications"), icon: "notifications"},
  ] as const;

  return (
    <>
      {/* Settings sub-nav */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-outline-variant/30 pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href as "/dashboard/settings"}
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
