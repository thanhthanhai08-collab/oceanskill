"use client";

import {useMemo, useState} from "react";
import {Link} from "@/i18n/navigation";
import SkillCard from "@/components/skills/SkillCard";
import WaterTiltCard from "@/components/ui/WaterTiltCard";
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
  if (filter === "agent-first") return skill.domain === "agent-first";
  const searchable = `${skill.title} ${skill.description} ${skill.domain}`.toLocaleLowerCase();
  if (filter === "marketing") return skill.domain === "marketing" || searchable.includes("marketing");
  return skill.domain === "productivity" || skill.domain === "marketing" || /sales|revenue|growth/.test(searchable);
}

export default function HomeSkillExplorer({skills, labels}: HomeSkillExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<HomeCategoryFilter>("all");
  const filteredSkills = useMemo(() => skills.filter((skill) => matchesFilter(skill, activeFilter)), [activeFilter, skills]);

  return (
    <section className="border-b border-outline-variant/25 bg-surface-container-lowest/45 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{labels.eyebrow}</p><h2 className="mt-3 font-geist text-3xl font-bold tracking-tight">{labels.title}</h2><p className="mt-2 text-on-surface-variant">{labels.subtitle}</p></div>
          <Link href="/skills" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">{labels.viewAll}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={labels.title}>
          {homeCategoryFilters.map((filter) => <button key={filter} type="button" aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeFilter === filter ? "border-primary bg-primary-container text-white shadow-lg shadow-primary-container/15" : "border-outline-variant/45 bg-surface-container-low text-on-surface-variant hover:border-primary/50 hover:text-on-surface"}`}>{labels.categories[filter]}</button>)}
        </div>
        {filteredSkills.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredSkills.slice(0, 6).map((skill, index) => <WaterTiltCard key={skill.id} className="rounded-2xl"><SkillCard skill={skill} featured={index === 0} actionLabel={labels.viewSkill} /></WaterTiltCard>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low/40 p-10 text-center"><span className="material-symbols-outlined text-4xl text-primary">filter_alt_off</span><p className="mt-3 text-on-surface-variant">{labels.empty}</p><Link href="/skills" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">{labels.viewAll}</Link></div>}
      </div>
    </section>
  );
}
