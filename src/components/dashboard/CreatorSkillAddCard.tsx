"use client";

import {useState} from "react";
import {Link} from "@/i18n/navigation";
import CreatorSkillForm from "@/components/dashboard/CreatorSkillForm";
import type {CreatorSkillFormLabels} from "@/components/dashboard/CreatorSkillForm";

export default function CreatorSkillAddCard({atLimit, count, limit, labels, formLabels}: {readonly atLimit: boolean; readonly count: number; readonly limit: number; readonly labels: {add: string; addHint: string; limitTitle: string; limitDescription: string; upgrade: string; close: string}; readonly formLabels: CreatorSkillFormLabels}) {
  const [showForm, setShowForm] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const open = () => atLimit ? setShowLimit(true) : setShowForm((value) => !value);
  return <>
    <button type="button" onClick={open} className="group flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/45 bg-primary/5 p-6 text-center transition hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-container text-3xl text-white transition group-hover:scale-105">+</span><span className="mt-4 font-geist text-lg font-semibold">{labels.add}</span><span className="mt-2 text-xs text-on-surface-variant">{labels.addHint} · {count}/{limit}</span>
    </button>
    {showForm && <section className="mt-5 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5 sm:p-7"><CreatorSkillForm labels={formLabels}/></section>}
    {showLimit && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => {if (event.currentTarget === event.target) setShowLimit(false);}}><div role="dialog" aria-modal="true" aria-labelledby="skill-limit-title" className="w-full max-w-md rounded-3xl border border-outline-variant/40 bg-background p-6 shadow-2xl sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10"><span className="material-symbols-outlined text-secondary">workspace_premium</span></div><h3 id="skill-limit-title" className="mt-5 font-geist text-2xl font-bold">{labels.limitTitle}</h3><p className="mt-3 text-sm leading-6 text-on-surface-variant">{labels.limitDescription}</p><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowLimit(false)} className="min-h-11 rounded-xl border border-outline-variant/50 px-5 py-3 text-sm font-semibold">{labels.close}</button><Link href="/dashboard/billing" className="min-h-11 rounded-xl bg-primary-container px-5 py-3 text-center text-sm font-semibold text-white">{labels.upgrade}</Link></div></div></div>}
  </>;
}
