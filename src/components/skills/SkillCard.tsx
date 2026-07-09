import {Link} from "@/i18n/navigation";
import Image from "next/image";
import type {SkillSummary} from "@/lib/catalog/skills";
import {getDomainVisual} from "@/data/mockData";

export interface SkillCardProps { readonly skill: SkillSummary; readonly featured?: boolean; readonly actionLabel: string; }

export default function SkillCard({skill, featured = false, actionLabel}: SkillCardProps) {
  const visual = getDomainVisual(skill.domain);
  const author = skill.authors;

  return (
    <Link href={`/skills/${skill.slug}`} className={`group flex h-full flex-col rounded-xl border bg-surface-container-low/70 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/60 ${featured ? "border-primary/60 shadow-[0_0_22px_rgba(46,91,255,0.14)]" : "border-outline-variant/45"}`}>
      <div className="flex items-start gap-3">
        <span className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${visual.glowClass}`}>
          <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:14px_14px]" />
          <span className={`material-symbols-outlined relative text-[26px] ${visual.accentClass} transition group-hover:scale-110`}>{visual.icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span className="truncate rounded-md border border-outline-variant/35 bg-surface-container-high/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{skill.domain}</span>
            <span className="shrink-0 font-mono text-[11px] text-on-surface-variant">v{skill.current_version ?? "-"}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 font-geist text-base font-semibold leading-5 tracking-tight transition group-hover:text-primary">{skill.title}</h2>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-5 text-on-surface-variant">{skill.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skill.compatible_clients.slice(0, 3).map((client) => <span key={client} className="rounded-md bg-surface-container-high px-2 py-1 font-mono text-[10px] text-on-surface-variant">{client}</span>)}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${author?.glow_class ?? visual.glowClass}`}>
            {author?.avatar_url ? <Image src={author.avatar_url} alt="" fill unoptimized sizes="24px" className="object-cover" /> : <span className="material-symbols-outlined text-[14px] text-white">{author?.icon ?? "person"}</span>}
          </span>
          <span className="truncate font-mono text-[11px] text-tertiary">{author?.name ?? "OceanSkill Creator"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">{actionLabel}<span className="material-symbols-outlined text-[16px] transition group-hover:translate-x-1">arrow_forward</span></span>
      </div>
    </Link>
  );
}
