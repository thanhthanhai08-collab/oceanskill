import type {ReactNode} from "react";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export interface SiteShellProps { readonly children: ReactNode; readonly showSearch?: boolean; }

export default function SiteShell({children, showSearch = true}: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <SiteHeader showSearch={showSearch} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
