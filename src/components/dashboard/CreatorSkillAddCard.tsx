"use client";

import {useState} from "react";
import {Link} from "@/i18n/navigation";
import CreatorSkillForm from "@/components/dashboard/CreatorSkillForm";
import type {CreatorSkillFormLabels} from "@/components/dashboard/CreatorSkillForm";

interface CreatorSkillAddCardProps {
  readonly atLimit: boolean;
  readonly hasPurchasedSlots: boolean;
  readonly showFreePlanHint: boolean;
  readonly count: number;
  readonly limit: number;
  readonly labels: {add: string; addHint: string; limitTitle: string; limitDescription: string; noSlotsTitle: string; noSlotsDescription: string; upgrade: string; close: string};
  readonly formLabels: CreatorSkillFormLabels;
}

export default function CreatorSkillAddCard({atLimit, hasPurchasedSlots, showFreePlanHint, count, limit, labels, formLabels}: CreatorSkillAddCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const open = () => atLimit ? setShowLimit(true) : setShowForm((value) => !value);

  return (
    <>
      <button type="button" onClick={open} className="group flex min-h-[260px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-transparent p-6 text-center transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-container-highest text-on-surface-variant transition group-hover:bg-primary group-hover:text-on-primary">
          <span className="material-symbols-outlined text-4xl">add</span>
        </span>
        <span>
          <span className="block font-geist text-base font-bold transition group-hover:text-primary">{labels.add}</span>
          {showFreePlanHint && <span className="mt-1 block text-xs text-on-surface-variant">{labels.addHint}</span>}
          <span className="mt-1 block font-mono text-[11px] text-on-surface-variant">{count}/{limit}</span>
        </span>
      </button>
      {showForm && <section className="mt-5 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5 sm:p-7"><CreatorSkillForm labels={formLabels}/></section>}
      {showLimit && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => {if (event.currentTarget === event.target) setShowLimit(false);}}>
          <div role="dialog" aria-modal="true" aria-labelledby="skill-limit-title" className="w-full max-w-md rounded-3xl border border-outline-variant/40 bg-background p-6 shadow-2xl sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10"><span className="material-symbols-outlined text-secondary">workspace_premium</span></div>
            <h3 id="skill-limit-title" className="mt-5 font-geist text-2xl font-bold">{hasPurchasedSlots ? labels.limitTitle : labels.noSlotsTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{hasPurchasedSlots ? labels.limitDescription : labels.noSlotsDescription}</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowLimit(false)} className="min-h-11 rounded-xl border border-outline-variant/50 px-5 py-3 text-sm font-semibold">{labels.close}</button>
              <Link href="/dashboard/billing/topup?purpose=creator-slots&amount=5000" className="btn-payment min-h-11 rounded-xl px-5 py-3 text-center text-sm font-semibold">{labels.upgrade}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
