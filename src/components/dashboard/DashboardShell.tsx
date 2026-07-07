import type {ReactNode} from "react";
import SiteShell from "@/components/layout/SiteShell";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type {DashboardSidebarProps} from "@/components/dashboard/DashboardSidebar";

export interface DashboardShellProps {
  readonly children: ReactNode;
  readonly sidebar: Omit<DashboardSidebarProps, never>;
}

export default function DashboardShell({children, sidebar}: DashboardShellProps) {
  return (
    <SiteShell showSearch={false}>
      <section className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSidebar {...sidebar} />
          <main className="min-w-0 py-8 lg:py-12">{children}</main>
        </div>
      </section>
    </SiteShell>
  );
}
