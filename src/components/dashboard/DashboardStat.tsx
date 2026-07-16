export interface DashboardStatProps { readonly icon: string; readonly label: string; readonly value: string; readonly description?: string; readonly accent?: "primary" | "secondary" | "tertiary"; }

export default function DashboardStat({icon, label, value, description}: DashboardStatProps) {
  return (
    <article className="min-w-0 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{label}</p><span className="material-symbols-outlined text-[19px] text-primary">{icon}</span></div>
      <p className="mt-5 font-geist text-3xl font-semibold tabular-nums tracking-[-0.035em]">{value}</p>
      {description && <p className="mt-2 max-w-xs text-xs leading-5 text-on-surface-variant">{description}</p>}
    </article>
  );
}
