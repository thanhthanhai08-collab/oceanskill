import {Link} from "@/i18n/navigation";
import {getCategoryVisual} from "@/data/mockData";
import type {RankedSkill} from "@/lib/catalog/readiness";

export interface LeaderboardListProps { readonly skills: RankedSkill[]; readonly scoreLabel: string; readonly integrationsLabel: string; }

export default function LeaderboardList({skills, scoreLabel, integrationsLabel}: LeaderboardListProps) {
  return (
    <div className="space-y-4">
      {skills.map((skill, index) => {
        const visual = getCategoryVisual(skill.category);
        const top = index === 0;
        return (
          <Link key={skill.id} href={`/skills/${skill.slug}`} className={`group grid items-center gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-primary/60 sm:grid-cols-[72px_1fr_auto] ${top ? "border-primary/60 bg-gradient-to-r from-primary-container/30 via-surface-container-low to-secondary-container/25 shadow-[0_0_30px_rgba(46,91,255,.14)]" : "border-outline-variant/40 bg-surface-container-low/60"}`}>
            <div className="flex items-center gap-3 sm:block">
              <span className={`font-geist text-2xl font-bold ${top ? "text-tertiary" : "text-on-surface-variant"}`}>#{index + 1}</span>
              {top && <span className="material-symbols-outlined ml-2 align-middle text-tertiary">emoji_events</span>}
            </div>
            <div className="flex min-w-0 items-center gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${visual.glowClass}`}><span className={`material-symbols-outlined ${visual.accentClass}`}>{visual.icon}</span></div>
              <div className="min-w-0"><h2 className="truncate font-geist text-lg font-semibold transition group-hover:text-primary sm:text-xl">{skill.title}</h2><p className="mt-1 truncate text-sm text-on-surface-variant"><span className="capitalize">{skill.category}</span> · {skill.compatible_clients.length} {integrationsLabel}</p></div>
            </div>
            <div className="flex items-end justify-between gap-4 sm:block sm:text-right"><span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{scoreLabel}</span><p className="font-geist text-2xl font-bold text-primary">{skill.readinessScore}</p></div>
          </Link>
        );
      })}
    </div>
  );
}
