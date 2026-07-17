import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import type {Locale} from "@/i18n/locales";
import {createPageMetadata} from "@/lib/seo/site";
import {getDashboardProfile} from "@/lib/dashboard/profile";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {logout} from "./actions";

export interface DashboardLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{locale: string}>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: DashboardLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "SEO"});
  return createPageMetadata({locale: locale as Locale, path: "dashboard", title: t("dashboardTitle"), description: t("siteDescription"), noIndex: true});
}

export default async function DashboardLayout({children, params}: DashboardLayoutProps) {
  const {locale} = await params;
  const [data, t, common] = await Promise.all([
    getDashboardProfile(),
    getTranslations("Dashboard"),
    getTranslations("Common"),
  ]);

  if (!data) redirect(`/${locale}/login`);

  const displayName =
    data.profile?.display_name ||
    data.profile?.email ||
    String(data.claims?.email ?? "OceanSkill");

  const sidebarLabels = {
    overview: t("overview"),
    skills: t("skills"),
    collections: t("collections"),
    mcpKeys: t("mcpKeys"),
    usage: t("usage"),
    billing: t("billing"),
    settings: t("settings"),
    creditBalance: t("availableCredits"),
    topUp: t("topUp"),
    logout: common("logout"),
    menuOpen: locale === "vi" ? "Mở menu Dashboard" : "Open Dashboard menu",
    menuClose: locale === "vi" ? "Đóng menu Dashboard" : "Close Dashboard menu",
  };

  return (
    <DashboardShell
      sidebar={{
        displayName,
        avatarUrl: data.profile?.avatar_url ?? null,
        roleLabel: t("roleLabel"),
        balance: data.balance,
        locale,
        labels: sidebarLabels,
        logoutAction: logout,
      }}
    >
      {children}
    </DashboardShell>
  );
}
