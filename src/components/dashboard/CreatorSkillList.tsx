import type {CreatorSkill} from "@/lib/skills/creator";

type Labels = Readonly<{empty: string; privateBadge: string; active: string; draft: string; archived: string; version: string; updated: string; contentHidden: string}>;

export default function CreatorSkillList({skills, labels, locale}: {readonly skills: CreatorSkill[]; readonly labels: Labels; readonly locale: string}) {
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});
  if (!skills.length) return <p className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">{labels.empty}</p>;
  return <div className="space-y-3">{skills.map((skill) => {
    const latest = skill.skill_versions.find((item) => item.version === skill.current_version) ?? skill.skill_versions[0];
    return <article key={skill.id} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-geist text-xl font-semibold">{skill.title}</h3><span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-1 font-mono text-[10px] text-secondary"><span className="material-symbols-outlined text-[13px]" aria-hidden>lock</span>{labels.privateBadge}</span></div><p className="mt-2 break-all font-mono text-[11px] text-on-surface-variant">{skill.id}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-on-surface-variant">{skill.description}</p></div><span className={`w-fit shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase ${skill.status === "active" ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-high text-on-surface-variant"}`}>{skill.status === "active" ? labels.active : skill.status === "draft" ? labels.draft : labels.archived}</span></div>
      <div className="mt-5 grid gap-3 border-t border-outline-variant/30 pt-4 text-xs text-on-surface-variant sm:grid-cols-3"><p><span className="font-semibold text-on-surface">{labels.version}:</span> {skill.current_version ?? "—"}</p><p><span className="font-semibold text-on-surface">SHA-256:</span> {latest?.content_hash.slice(0, 12) ?? "—"}…</p><p><span className="font-semibold text-on-surface">{labels.updated}:</span> {date.format(new Date(skill.updated_at))}</p></div><p className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant"><span className="material-symbols-outlined text-[17px] text-secondary">visibility_off</span>{labels.contentHidden}</p>
    </article>;
  })}</div>;
}
