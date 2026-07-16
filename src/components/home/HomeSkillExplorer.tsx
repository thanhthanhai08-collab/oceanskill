"use client";

import {useMemo, useState} from "react";
import {Link} from "@/i18n/navigation";
import SkillCard from "@/components/skills/SkillCard";
import {homeCategoryFilters, type HomeCategoryFilter} from "@/data/mockData";
import type {SkillSummary} from "@/lib/catalog/skills";

export interface HomeSkillExplorerProps {
  readonly skills: SkillSummary[];
  readonly labels: Readonly<{
    eyebrow: string;
    title: string;
    subtitle: string;
    viewAll: string;
    viewSkill: string;
    empty: string;
    categories: Record<HomeCategoryFilter, string>;
  }>;
}

function matchesFilter(skill: SkillSummary, filter: HomeCategoryFilter) {
  if (filter === "all") return true;
  if (filter === "ai-agent") return skill.category === "ai-agent";
  const searchable = `${skill.title} ${skill.description} ${skill.category}`.toLocaleLowerCase();
  if (filter === "marketing") return skill.category === "marketing" || searchable.includes("marketing");
  return skill.category === "productivity" || skill.category === "marketing" || /sales|revenue|growth/.test(searchable);
}

export default function HomeSkillExplorer({skills, labels}: HomeSkillExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<HomeCategoryFilter>("all");
  const filteredSkills = useMemo(() => skills.filter((skill) => matchesFilter(skill, activeFilter)), [activeFilter, skills]);

  return (
    <section className="border-b border-outline-variant/35 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary lg:col-span-3">{labels.eyebrow}</p>
          <div className="lg:col-span-7"><h2 className="max-w-2xl text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{labels.title}</h2><p className="mt-4 max-w-2xl text-pretty leading-7 text-on-surface-variant">{labels.subtitle}</p></div>
          <Link href="/skills" className="hidden items-center justify-end gap-1 text-sm font-semibold text-primary underline decoration-outline-variant underline-offset-4 transition hover:decoration-primary sm:flex lg:col-span-2">{labels.viewAll}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-1 gap-y-2 border-b border-outline-variant/45" role="group" aria-label={labels.title}>
          {homeCategoryFilters.map((filter) => <button key={filter} type="button" aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)} className={`relative px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeFilter === filter ? "text-primary after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{labels.categories[filter]}</button>)}
        </div>
        {filteredSkills.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-12">{filteredSkills.slice(0, 6).map((skill, index) => <div key={skill.id} className={`${index % 4 === 0 || index % 4 === 3 ? "lg:col-span-7" : "lg:col-span-5"}`}><SkillCard skill={skill} featured={index === 0} actionLabel={labels.viewSkill} /></div>)}</div> : <div className="mt-8 border border-dashed border-outline-variant/50 bg-surface-container-low/40 p-10 text-center"><span className="material-symbols-outlined text-4xl text-primary">filter_alt_off</span><p className="mt-3 text-on-surface-variant">{labels.empty}</p><Link href="/skills" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">{labels.viewAll}</Link></div>}
      </div>
    </section>
  );
}
