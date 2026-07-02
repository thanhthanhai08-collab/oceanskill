"use client";

import {useEffect, useState} from "react";

export interface SaveArticleButtonProps {
  readonly slug: string;
  readonly saveLabel: string;
  readonly savedLabel: string;
}

const storageKey = "oceanskill:saved-articles";

export default function SaveArticleButton({slug, saveLabel, savedLabel}: SaveArticleButtonProps) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setSaved(JSON.parse(localStorage.getItem(storageKey) ?? "[]").includes(slug)); } catch { setSaved(false); }
    });
    return () => cancelAnimationFrame(frame);
  }, [slug]);

  const toggleSaved = () => {
    let slugs: string[] = [];
    try { slugs = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { slugs = []; }
    const nextSaved = !slugs.includes(slug);
    const next = nextSaved ? [...slugs, slug] : slugs.filter((item) => item !== slug);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(nextSaved);
  };

  return <button type="button" aria-pressed={saved} onClick={toggleSaved} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${saved ? "border-tertiary/50 bg-tertiary/10 text-tertiary" : "border-outline-variant/50 text-on-surface hover:border-primary/60 hover:text-primary"}`}><span className="material-symbols-outlined text-[19px]">{saved ? "bookmark_added" : "bookmark_add"}</span>{saved ? savedLabel : saveLabel}</button>;
}
