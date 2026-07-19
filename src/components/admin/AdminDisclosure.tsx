import type {ReactNode} from "react";

export default function AdminDisclosure({title, meta, icon, badge, children}: {readonly title: string; readonly meta: string; readonly icon: string; readonly badge?: ReactNode; readonly children: ReactNode}) {
  return <details className="group overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low/55 transition open:border-primary/30 open:shadow-[0_18px_50px_rgba(36,45,88,0.10)]">
    <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 marker:hidden transition hover:bg-surface-container/55 sm:px-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-secondary/10 text-primary"><span className="material-symbols-outlined">{icon}</span></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-geist text-base font-bold sm:text-lg">{title}</span><span className="mt-1 block truncate font-mono text-[11px] text-on-surface-variant">{meta}</span></span>
      {badge}
      <span className="material-symbols-outlined shrink-0 text-on-surface-variant transition group-open:rotate-180 group-open:text-primary">expand_more</span>
    </summary>
    <div className="border-t border-outline-variant/35 bg-background/30 p-3 sm:p-5">{children}</div>
  </details>;
}
