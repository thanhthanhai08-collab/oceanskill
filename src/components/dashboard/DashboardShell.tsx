import type {ReactNode} from "react";
import SiteShell from "@/components/layout/SiteShell";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type {DashboardSidebarProps} from "@/components/dashboard/DashboardSidebar";

export interface DashboardShellProps {
  readonly children: ReactNode;
  readonly sidebar: DashboardSidebarProps;
}

export default function DashboardShell({children, sidebar}: DashboardShellProps) {
  return (
    <SiteShell showSearch={false}>
      <section className="dashboard-shell mx-auto grid w-full max-w-[1440px] gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 lg:px-8">
        <DashboardSidebar {...sidebar} />
        <main className="min-w-0 py-10 lg:py-12">{children}</main>
      </section>
    </SiteShell>
  );
}
