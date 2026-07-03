"use client";

import {useMemo, useState} from "react";
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
  securityDescription: string;
}>;

function PlatformCard({skill, typeLabel}: {readonly skill: FoundationSkill; readonly typeLabel: string}) {
  const visual = getDomainVisual(skill.domain);
  return <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5"><div className="flex items-start gap-3"><span className={`material-symbols-outlined text-[22px] ${visual.accentClass}`}>{visual.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-geist font-semibold">{skill.title}</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase text-primary">{typeLabel}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface-variant">{skill.description}</p><p className="mt-3 font-mono text-[10px] text-on-surface-variant">{skill.domain} · v{skill.current_version ?? "—"}</p></div></div></article>;
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

  const allSkills = useMemo(() => {
    const combined = [
      ...library.map((skill) => ({...skill, _type: labels.platformBadge, _key: `all-platform-${skill.id}`})),
      ...uploaded.map((skill) => ({...skill, _type: labels.uploadedBadge, _key: `all-upload-${skill.id}`})),
    ];
    return combined.sort((a, b) => a.title.localeCompare(b.title, locale, {sensitivity: "base"}));
  }, [library, uploaded, labels.platformBadge, labels.uploadedBadge, locale]);

  const total = allSkills.length;
  const tabs: ReadonlyArray<{key: TabKey; label: string; count: number}> = [
    {key: "all", label: labels.tabAll, count: total},
    {key: "platform", label: labels.tabPlatform, count: library.length},
    {key: "uploaded", label: labels.tabUploaded, count: uploaded.length},
  ];

  return <div className="mt-9">
    <div role="tablist" aria-label={labels.tabAll} className="flex flex-wrap gap-2 border-b border-outline-variant/30">
      {tabs.map((item) => {
        const selected = tab === item.key;
        return <button key={item.key} type="button" role="tab" aria-selected={selected} onClick={() => setTab(item.key)} className={`-mb-px inline-flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition ${selected ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
          {item.label}
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${selected ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{item.count}</span>
        </button>;
      })}
    </div>

    {tab === "all" && <section className="mt-6" aria-label={labels.tabAll}>
      <p className="text-sm text-on-surface-variant">{labels.allSkillsDescription}</p>
      {total ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{allSkills.map((skill) => <PlatformCard key={skill._key} skill={skill} typeLabel={skill._type}/>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">{labels.emptyAll}</p>}
    </section>}

    {tab === "platform" && <section className="mt-6" aria-label={labels.tabPlatform}>
      <p className="text-sm text-on-surface-variant">{labels.platformSkillsDescription}</p>
      {library.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{library.map((skill) => <PlatformCard key={skill.id} skill={skill} typeLabel={labels.platformBadge}/>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">{labels.emptyPlatform}</p>}
    </section>}

    {tab === "uploaded" && <section className="mt-6" aria-label={labels.tabUploaded}>
      <p className="text-sm text-on-surface-variant">{labels.uploadedSkillsDescription}</p>
      <div className="mt-5"><CreatorSkillList skills={uploaded} locale={locale} labels={cardLabels}/></div>
      <div className="mt-4"><CreatorSkillAddCard atLimit={atLimit} count={uploaded.length} limit={limit} formLabels={formLabels} labels={{add: labels.addSkill, addHint: labels.addSkillHint, limitTitle: labels.limitTitle, limitDescription: labels.limitDescription, upgrade: labels.upgradePlan, close: labels.close}}/></div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-on-surface-variant"><span className="material-symbols-outlined text-[17px] text-secondary">verified_user</span>{labels.securityDescription}</p>
    </section>}
  </div>;
}
