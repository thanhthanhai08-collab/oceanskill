import {Link} from "@/i18n/navigation";
import type {SkillSummary} from "@/lib/catalog/skills";

export interface SkillPurchasePanelProps {
  readonly skill: SkillSummary;
  readonly labels: Readonly<{
    availableVia: string;
    version: string;
    license: string;
    start: string;
    verified: string;
  }>;
}

export default function SkillPurchasePanel({skill, labels}: SkillPurchasePanelProps) {
  return (
    <aside className="glowing-border rounded-2xl border border-primary/35 bg-gradient-to-br from-primary-container/25 via-surface-container-low to-secondary-container/20 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{labels.availableVia}</p>
        <span className="inline-flex items-center gap-1 text-xs text-tertiary"><span className="material-symbols-outlined text-[16px]">verified</span>{labels.verified}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{skill.compatible_clients.map((client) => <span key={client} className="rounded-lg border border-outline-variant/50 bg-background/50 px-3 py-2 font-mono text-xs">{client}</span>)}</div>
      <dl className="mt-7 space-y-4 border-t border-outline-variant/35 pt-6 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{labels.version}</dt><dd className="font-mono">{skill.current_version ?? "—"}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{labels.license}</dt><dd>{skill.license_spdx ?? "—"}</dd></div>
      </dl>
      <Link href="/login" className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-3 font-semibold text-white transition hover:bg-inverse-primary">{labels.start}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
    </aside>
  );
}
