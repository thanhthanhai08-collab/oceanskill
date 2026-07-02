export interface DashboardStatProps { readonly icon: string; readonly label: string; readonly value: string; readonly description?: string; readonly accent?: "primary" | "secondary" | "tertiary"; }

export default function DashboardStat({icon, label, value, description, accent = "primary"}: DashboardStatProps) {
  const accentClass = accent === "secondary" ? "text-secondary" : accent === "tertiary" ? "text-tertiary" : "text-primary";
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
      <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{label}</p><span className={`material-symbols-outlined text-[20px] ${accentClass}`}>{icon}</span></div>
      <p className="mt-4 font-geist text-3xl font-bold">{value}</p>
      {description && <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>}
    </div>
  );
}
