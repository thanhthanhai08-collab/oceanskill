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
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        <DashboardSidebar {...sidebar} />
        <main className="min-w-0 py-10 lg:py-14">{children}</main>
      </section>
    </SiteShell>
  );
}
