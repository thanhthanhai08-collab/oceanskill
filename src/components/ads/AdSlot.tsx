export interface AdSlotProps {
  readonly label: string;
  readonly format?: "banner" | "rectangle" | "in-article";
  readonly className?: string;
}

export default function AdSlot({label, format = "banner", className = ""}: AdSlotProps) {
  const height = format === "rectangle" ? "min-h-72" : format === "in-article" ? "min-h-36" : "min-h-28";
  return <aside aria-label={label} data-ad-slot={format} className={`grid ${height} place-items-center rounded-2xl border border-dashed border-outline-variant/45 bg-surface-container-low/35 p-5 text-center ${className}`}><div><span className="material-symbols-outlined text-2xl text-on-surface-variant/55">ad</span><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">{label}</p></div></aside>;
}
