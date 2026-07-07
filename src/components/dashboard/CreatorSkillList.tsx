import type {CreatorSkill} from "@/lib/skills/creator";
import {getDomainVisual} from "@/data/mockData";

type Labels = Readonly<{empty: string; privateBadge: string; active: string; draft: string; archived: string; version: string; updated: string; contentHidden: string}>;

interface CreatorSkillListProps {
  readonly skills: CreatorSkill[];
  readonly labels: Labels;
  readonly locale: string;
}

export default function CreatorSkillList({skills, labels, locale}: CreatorSkillListProps) {
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});
  if (!skills.length) return <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-on-surface-variant">{labels.empty}</p>;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {skills.map((skill) => {
        const latest = skill.skill_versions.find((item) => item.version === skill.current_version) ?? skill.skill_versions[0];
        const visual = getDomainVisual(skill.domain);
        return (
          <article key={skill.id} className="group flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-highest ${visual.accentClass}`}>
                <span className="material-symbols-outlined text-3xl">{visual.icon}</span>
              </div>
              <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase ${skill.status === "active" ? "border-primary/20 bg-primary/10 text-primary" : "border-error/20 bg-error/10 text-error"}`}>
                {skill.status === "active" ? labels.active : skill.status === "draft" ? labels.draft : labels.archived}
              </span>
            </div>
            <h3 className="font-geist text-xl font-bold tracking-tight transition group-hover:text-primary">{skill.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">{labels.privateBadge}</span>
              <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">{labels.version}: {skill.current_version ?? "n/a"}</span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">{skill.description}</p>
            <div className="mt-auto border-t border-white/5 pt-5 text-xs text-on-surface-variant">
              <p><span className="font-semibold text-on-surface">SHA-256:</span> {latest?.content_hash.slice(0, 12) ?? "n/a"}...</p>
              <p className="mt-1"><span className="font-semibold text-on-surface">{labels.updated}:</span> {date.format(new Date(skill.updated_at))}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
