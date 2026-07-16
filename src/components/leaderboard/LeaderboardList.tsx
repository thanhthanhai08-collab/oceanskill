import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {getCategoryVisual} from "@/data/mockData";
import type {LeaderboardSkill} from "@/lib/catalog/leaderboard";

export interface LeaderboardListProps {
  readonly skills: LeaderboardSkill[];
  readonly labels: Readonly<{calls: string; rating: string; reviews: string; noRating: string; empty: string}>;
  readonly locale: string;
}

export default function LeaderboardList({skills, labels, locale}: LeaderboardListProps) {
  if (!skills.length) return <div className="border-y border-outline-variant/50 py-16 text-center text-on-surface-variant">{labels.empty}</div>;
  return (
    <div className="border-t border-outline-variant/55">
      {skills.map((skill) => {
        const visual = getCategoryVisual(skill.category);
        const top = skill.rank === 1;
        return (
          <Link key={skill.skill_id} href={`/skills/${skill.slug}`} className={`group grid gap-5 border-b border-outline-variant/55 px-3 py-6 transition duration-200 hover:bg-surface-container-low/60 sm:grid-cols-[4rem_minmax(0,1fr)] sm:px-5 lg:grid-cols-[5rem_minmax(0,1fr)_9rem_9rem_7rem] lg:items-center ${top ? "bg-primary/[.055] py-8" : ""}`}>
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-[10px] text-on-surface-variant ${top ? "text-primary" : ""}`}>#</span>
              <span className={`font-geist font-semibold tabular-nums tracking-[-0.04em] ${top ? "text-5xl text-primary" : "text-3xl text-on-surface-variant"}`}>{String(skill.rank).padStart(2, "0")}</span>
            </div>
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-outline-variant/45 bg-surface-container-lowest">
                {skill.author_avatar_url ? <Image src={skill.author_avatar_url} alt="" fill unoptimized sizes="48px" className="object-cover" /> : <span className="material-symbols-outlined text-primary">{visual.icon}</span>}
              </span>
              <span className="min-w-0"><span className="block truncate font-geist text-lg font-semibold tracking-tight transition group-hover:text-primary sm:text-xl">{skill.title}</span><span className="mt-1 block truncate text-sm text-on-surface-variant">{skill.author_name} · <span className="capitalize">{skill.category}</span></span></span>
            </div>
            <div className="col-start-2 lg:col-start-auto lg:text-right"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.calls}</span><p className="mt-1 font-geist text-2xl font-semibold tabular-nums text-primary">{skill.mcp_calls.toLocaleString(locale)}</p></div>
            <div className="col-start-2 lg:col-start-auto lg:text-right"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.rating}</span><p className="mt-1 font-geist text-lg font-semibold tabular-nums">{skill.review_count ? `${skill.average_rating.toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 2})} / 5` : labels.noRating}</p></div>
            <div className="col-start-2 lg:col-start-auto lg:text-right"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">{labels.reviews}</span><p className="mt-1 font-geist text-lg font-semibold tabular-nums">{skill.review_count.toLocaleString(locale)}</p></div>
          </Link>
        );
      })}
    </div>
  );
}
