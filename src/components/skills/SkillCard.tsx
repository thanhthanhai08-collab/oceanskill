import {Link} from "@/i18n/navigation";
import type {SkillSummary} from "@/lib/catalog/skills";
import {getDomainVisual} from "@/data/mockData";
import {getSkillAuthorName} from "@/lib/catalog/skill-authors";

export interface SkillCardProps { readonly skill: SkillSummary; readonly featured?: boolean; readonly actionLabel: string; }

export default function SkillCard({skill, featured = false, actionLabel}: SkillCardProps) {
  const visual = getDomainVisual(skill.domain);
  const authorName = getSkillAuthorName(skill);
  return (
    <Link href={`/skills/${skill.slug}`} className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-surface-container-low/70 transition duration-300 hover:-translate-y-1 hover:border-primary/60 ${featured ? "border-primary/60 shadow-[0_0_30px_rgba(46,91,255,0.16)]" : "border-outline-variant/45"}`}>
      <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${visual.glowClass}`}>
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
        <span className={`material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-[70px] ${visual.accentClass} opacity-90 transition group-hover:scale-110`}>{visual.icon}</span>
        <span className="absolute right-4 top-4 rounded-md border border-white/15 bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-on-surface">{skill.domain}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-geist text-xl font-semibold tracking-tight transition group-hover:text-primary">{skill.title}</h2>
          <span className="shrink-0 font-mono text-xs text-on-surface-variant">v{skill.current_version ?? "—"}</span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{skill.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {skill.compatible_clients.slice(0, 3).map((client) => <span key={client} className="rounded-md bg-surface-container-high px-2 py-1 font-mono text-[10px] text-on-surface-variant">{client}</span>)}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-5">
          <span className="font-mono text-xs text-tertiary">{authorName}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">{actionLabel}<span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-1">arrow_forward</span></span>
        </div>
      </div>
    </Link>
  );
}
