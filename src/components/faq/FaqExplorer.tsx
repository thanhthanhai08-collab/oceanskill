"use client";

import {useMemo, useState} from "react";
import {Link} from "@/i18n/navigation";

export type FaqItem = Readonly<{id: string; category: string; question: string; answer: string; href?: string}>;
export type FaqCategory = Readonly<{id: string; label: string}>;

interface FaqExplorerProps {
  readonly items: FaqItem[];
  readonly categories: FaqCategory[];
  readonly allLabel: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly noResults: string;
  readonly relatedResource: string;
  readonly resultCount: (count: number) => string;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export default function FaqExplorer({items, categories, allLabel, searchLabel, searchPlaceholder, noResults, relatedResource, resultCount}: FaqExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const visibleItems = useMemo(() => {
    const term = normalize(query);
    return items.filter((item) => (category === "all" || item.category === category) && (!term || normalize(`${item.question} ${item.answer}`).includes(term)));
  }, [category, items, query]);

  return <div>
    <div className="relative mx-auto max-w-3xl">
      <label htmlFor="faq-search" className="sr-only">{searchLabel}</label>
      <span className="material-symbols-outlined pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input id="faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="h-14 w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest pl-14 pr-5 text-base shadow-xl shadow-primary-container/5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
    </div>
    <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label={searchLabel}>
      <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")} className={`rounded-full border px-4 py-2 text-sm transition ${category === "all" ? "border-primary bg-primary-container text-white" : "border-outline-variant/45 text-on-surface-variant hover:border-primary/50 hover:text-primary"}`}>{allLabel}</button>
      {categories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={`rounded-full border px-4 py-2 text-sm transition ${category === item.id ? "border-primary bg-primary-container text-white" : "border-outline-variant/45 text-on-surface-variant hover:border-primary/50 hover:text-primary"}`}>{item.label}</button>)}
    </div>
    <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-wider text-on-surface-variant" aria-live="polite">{resultCount(visibleItems.length)}</p>
    <div className="mx-auto mt-4 max-w-4xl space-y-3">
      {visibleItems.map((item) => <details key={item.id} id={item.id} className="group scroll-mt-28 rounded-2xl border border-outline-variant/40 bg-surface-container-low/55 open:border-primary/40 open:bg-surface-container">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 font-geist text-base font-semibold marker:content-none sm:p-6 sm:text-lg">
          <span>{item.question}</span><span className="material-symbols-outlined shrink-0 text-primary transition-transform group-open:rotate-45">add</span>
        </summary>
        <div className="border-t border-outline-variant/25 px-5 pb-6 pt-4 sm:px-6">
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-base">{item.answer}</p>
          {item.href && <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{relatedResource}<span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>}
        </div>
      </details>)}
      {visibleItems.length === 0 && <div className="rounded-2xl border border-dashed border-outline-variant/60 p-10 text-center text-on-surface-variant">{noResults}</div>}
    </div>
  </div>;
}
