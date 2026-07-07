"use client";

import {useMemo, useState, useTransition} from "react";
import type {CreatorSkill, FoundationSkill, LibrarySkill} from "@/lib/skills/creator";
import {getDomainVisual} from "@/data/mockData";
import CreatorSkillList from "@/components/dashboard/CreatorSkillList";
import CreatorSkillAddCard from "@/components/dashboard/CreatorSkillAddCard";
import type {CreatorSkillFormLabels} from "@/components/dashboard/CreatorSkillForm";

type TabKey = "all" | "platform" | "uploaded";

type CardLabels = Readonly<{empty: string; privateBadge: string; active: string; draft: string; archived: string; version: string; updated: string; contentHidden: string}>;

type TabsLabels = Readonly<{
  tabAll: string; tabPlatform: string; tabUploaded: string;
  platformBadge: string; uploadedBadge: string;
  allSkillsDescription: string; platformSkillsDescription: string; uploadedSkillsDescription: string;
  emptyAll: string; emptyPlatform: string;
  addSkill: string; addSkillHint: string; limitTitle: string; limitDescription: string; upgradePlan: string; close: string;
  securityDescription: string; removeSkill: string; removeFailed: string;
  totalSkills: string; monthlyRevenue: string; sellerRank: string;
}>;

interface PlatformCardProps {
  readonly skill: FoundationSkill;
  readonly typeLabel: string;
  readonly removable?: boolean;
  readonly removeLabel?: string;
  readonly onRemove?: (id: string) => void;
}

function PlatformCard({skill, typeLabel, removable = false, removeLabel, onRemove}: PlatformCardProps) {
  const visual = getDomainVisual(skill.domain);
  return (
    <article className="group relative flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]">
      {removable && (
        <button
          type="button"
          onClick={() => onRemove?.(skill.id)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-on-surface-variant opacity-100 transition hover:bg-error/20 hover:text-error md:opacity-0 md:group-hover:opacity-100"
          aria-label={removeLabel}
          title={removeLabel}
        >
          <span className="material-symbols-outlined text-[17px]">close</span>
        </button>
      )}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-highest ${visual.accentClass}`}>
          <span className="material-symbols-outlined text-3xl">{visual.icon}</span>
        </div>
        <span className="rounded-full bg-surface-container-highest/50 px-3 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">{typeLabel}</span>
      </div>
      <div>
        <h3 className="font-geist text-xl font-bold tracking-tight transition group-hover:text-primary">{skill.title}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">{skill.domain}</span>
          {skill.current_version && <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">v{skill.current_version}</span>}
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">{skill.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-5">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-surface-container-high">
            <span className="material-symbols-outlined text-[14px]">person</span>
          </span>
          OceanSkill
        </div>
        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px]">star</span>
          4.8/5
        </div>
      </div>
    </article>
  );
}

export default function DashboardSkillsTabs({library, uploaded, locale, limit, atLimit, labels, cardLabels, formLabels}: {
  readonly library: LibrarySkill[];
  readonly uploaded: CreatorSkill[];
  readonly locale: string;
  readonly limit: number;
  readonly atLimit: boolean;
  readonly labels: TabsLabels;
  readonly cardLabels: CardLabels;
  readonly formLabels: CreatorSkillFormLabels;
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [librarySkills, setLibrarySkills] = useState(library);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allSkills = useMemo(() => {
    const combined = [
      ...librarySkills.map((skill) => ({...skill, source: "library" as const})),
      ...uploaded.map((skill) => ({...skill, source: "uploaded" as const})),
    ];
    return combined.sort((a, b) => a.title.localeCompare(b.title, locale, {sensitivity: "base"}));
  }, [librarySkills, uploaded, locale]);

  const handleRemove = (id: string) => {
    setRemoveError(null);
    startTransition(async () => {
      const res = await fetch(`/api/user-skill-library/${id}`, {method: "DELETE"});
      if (!res.ok) {
        setRemoveError(labels.removeFailed);
        return;
      }
      setLibrarySkills((prev) => prev.filter((skill) => skill.id !== id));
    });
  };

  const tabs: ReadonlyArray<{key: TabKey; label: string; count: number}> = [
    {key: "all", label: labels.tabAll, count: allSkills.length},
    {key: "platform", label: labels.tabPlatform, count: librarySkills.length},
    {key: "uploaded", label: labels.tabUploaded, count: uploaded.length},
  ];

  return (
    <section className="mt-12 pb-12">
      <div role="tablist" aria-label={labels.tabAll} className="flex items-center gap-8 overflow-x-auto border-b border-white/5">
        {tabs.map((item) => {
          const selected = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.key)}
              className={`-mb-px whitespace-nowrap border-b-2 px-2 pb-4 text-sm font-bold transition ${selected ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {removeError && <p className="mt-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">{removeError}</p>}

      {tab === "all" && (
        <div className="mt-8">
          {allSkills.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {allSkills.map((skill) => skill.source === "library" ? (
                <PlatformCard key={`library-${skill.id}`} skill={skill} typeLabel={labels.platformBadge} removable removeLabel={labels.removeSkill} onRemove={handleRemove} />
              ) : (
                <PlatformCard key={`uploaded-${skill.id}`} skill={skill} typeLabel={labels.uploadedBadge} />
              ))}
              <CreatorSkillAddCard atLimit={atLimit} count={uploaded.length} limit={limit} formLabels={formLabels} labels={{add: labels.addSkill, addHint: labels.addSkillHint, limitTitle: labels.limitTitle, limitDescription: labels.limitDescription, upgrade: labels.upgradePlan, close: labels.close}}/>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-on-surface-variant">{labels.emptyAll}</p>
          )}
        </div>
      )}

      {tab === "platform" && (
        <div className="mt-8">
          {librarySkills.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {librarySkills.map((skill) => <PlatformCard key={skill.id} skill={skill} typeLabel={labels.platformBadge} removable removeLabel={labels.removeSkill} onRemove={handleRemove} />)}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-on-surface-variant">{labels.emptyPlatform}</p>
          )}
        </div>
      )}

      {tab === "uploaded" && (
        <div className="mt-8">
          <CreatorSkillList skills={uploaded} locale={locale} labels={cardLabels}/>
          <div className="mt-6">
            <CreatorSkillAddCard atLimit={atLimit} count={uploaded.length} limit={limit} formLabels={formLabels} labels={{add: labels.addSkill, addHint: labels.addSkillHint, limitTitle: labels.limitTitle, limitDescription: labels.limitDescription, upgrade: labels.upgradePlan, close: labels.close}}/>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-on-surface-variant"><span className="material-symbols-outlined text-[17px] text-secondary">verified_user</span>{labels.securityDescription}</p>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 border-l-primary bg-surface-container-low/55 p-6">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{labels.totalSkills}</p>
          <h4 className="font-geist text-4xl font-bold">{allSkills.length}</h4>
        </div>
        <div className="rounded-2xl border border-white/10 border-l-secondary bg-surface-container-low/55 p-6">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{labels.monthlyRevenue}</p>
          <h4 className="font-geist text-4xl font-bold">$2.4k</h4>
        </div>
        <div className="rounded-2xl border border-white/10 border-l-tertiary bg-surface-container-low/55 p-6">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{labels.sellerRank}</p>
          <h4 className="font-geist text-4xl font-bold uppercase">Pro</h4>
        </div>
      </div>
    </section>
  );
}
