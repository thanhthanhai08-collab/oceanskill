import type {CreatorSkill} from "@/lib/skills/creator";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {getCategoryVisual} from "@/data/mockData";
import type {SkillReviewStats} from "@/lib/skills/reviews";

type Labels = Readonly<{empty: string; privateBadge: string; active: string; draft: string; archived: string; version: string; updated: string; contentHidden: string}>;

interface CreatorSkillListProps {
  readonly skills: CreatorSkill[];
  readonly reviewStatsBySkillId: Record<string, SkillReviewStats>;
  readonly labels: Labels;
  readonly locale: string;
}

export default function CreatorSkillList({skills, reviewStatsBySkillId, labels, locale}: CreatorSkillListProps) {
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});
  if (!skills.length) return <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-on-surface-variant">{labels.empty}</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {skills.map((skill) => {
        const latest = skill.skill_versions.find((item) => item.version === skill.current_version) ?? skill.skill_versions[0];
        const visual = getCategoryVisual(skill.category);
        const author = skill.authors;
        const reviewStats = reviewStatsBySkillId[skill.id];
        const rating = reviewStats?.count ? reviewStats.average.toFixed(1) : "0.0";
        return (
          <article key={skill.id} className="group flex min-h-[210px] flex-col rounded-xl border border-white/10 bg-surface-container-low/55 p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.04]">
            <Link href={`/skills/${skill.slug}` as "/skills"} className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-highest ${visual.accentClass}`}>
                  <span className="material-symbols-outlined text-2xl">{visual.icon}</span>
                </div>
                <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase ${skill.status === "active" ? "border-primary/20 bg-primary/10 text-primary" : "border-error/20 bg-error/10 text-error"}`}>
                  {skill.status === "active" ? labels.active : skill.status === "draft" ? labels.draft : labels.archived}
                </span>
              </div>
              <h3 className="line-clamp-1 font-geist text-base font-bold tracking-tight transition group-hover:text-primary">{skill.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">{labels.privateBadge}</span>
                <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">{labels.version}: {skill.current_version ?? "n/a"}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-5 text-on-surface-variant">{skill.description}</p>
              <div className="mt-auto border-t border-white/5 pt-3 text-xs text-on-surface-variant">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br ${author?.glow_class ?? visual.glowClass}`}>
                      {author?.avatar_url ? <Image src={author.avatar_url} alt="" fill unoptimized sizes="24px" className="object-cover" /> : <span className="material-symbols-outlined text-[14px] text-white">{author?.icon ?? "person"}</span>}
                    </span>
                    <span className="truncate">{author?.name ?? "OceanSkill Creator"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: reviewStats?.count ? "'FILL' 1" : "'FILL' 0"}}>star</span>
                    {rating}/5
                  </span>
                </div>
                <p><span className="font-semibold text-on-surface">SHA-256:</span> {latest?.content_hash.slice(0, 12) ?? "n/a"}...</p>
                <p className="mt-1"><span className="font-semibold text-on-surface">{labels.updated}:</span> {date.format(new Date(skill.updated_at))}</p>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
