"use client";

import {useMemo, useState} from "react";
import {useRouter} from "@/i18n/navigation";
import type {CreatorSkill, LibrarySkill} from "@/lib/skills/creator";
import type {SkillCollection} from "@/lib/skills/collections";
import {getDomainVisual} from "@/data/mockData";
import {isValidCollectionSlug, slugifyCollectionName} from "@/lib/skills/collectionSlug";

type SkillItem = Readonly<{
  id: string;
  title: string;
  description: string;
  domain: string;
  source: "library" | "uploaded";
}>;

type Labels = Readonly<{
  name: string;
  key: string;
  keyHint: string;
  keyWarning: string;
  description: string;
  search: string;
  library: string;
  uploaded: string;
  emptySkills: string;
  save: string;
  saving: string;
  saveFailed: string;
}>;

export default function DashboardCollectionDetail({collection, library, uploaded, labels}: {
  readonly collection: SkillCollection;
  readonly library: LibrarySkill[];
  readonly uploaded: CreatorSkill[];
  readonly labels: Labels;
}) {
  const router = useRouter();
  const skills = useMemo<SkillItem[]>(() => [
    ...library.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, domain: skill.domain, source: "library" as const})),
    ...uploaded.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, domain: skill.domain, source: "uploaded" as const})),
  ], [library, uploaded]);

  const [name, setName] = useState(collection.name);
  const [slug, setSlug] = useState(collection.slug);
  const [description, setDescription] = useState(collection.description);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(collection.skillIds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return skills;
    return skills.filter((skill) => [skill.title, skill.description, skill.domain].some((value) => value.toLowerCase().includes(term)));
  }, [query, skills]);
  const canSave = name.trim().length > 0 && isValidCollectionSlug(slug) && selectedIds.length > 0;

  const toggleSkill = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const save = async () => {
    if (!canSave) return;
    setError(null);
    setIsSaving(true);
    const response = await fetch(`/api/dashboard/collections/${collection.id}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name: name.trim(), slug, description: description.trim(), skillIds: selectedIds}),
    });
    setIsSaving(false);
    if (!response.ok) {
      setError(labels.saveFailed);
      return;
    }
    if (slug !== collection.slug) router.replace(`/dashboard/collections/${slug}` as "/dashboard/collections");
    router.refresh();
  };

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-on-surface-variant">{labels.name}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-primary/50" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-on-surface-variant">{labels.key}</span>
            <input value={slug} onChange={(event) => setSlug(slugifyCollectionName(event.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-primary/50" />
            <span className="text-xs leading-5 text-on-surface-variant">{labels.keyHint}</span>
          </label>
          <p className="rounded-xl border border-tertiary/20 bg-tertiary/10 p-4 text-sm leading-6 text-on-surface-variant">{labels.keyWarning}</p>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-on-surface-variant">{labels.description}</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-primary/50" />
          </label>
        </div>
      </div>

      <aside className="rounded-2xl border border-white/10 bg-surface-container-low/65 p-5 lg:sticky lg:top-24 lg:h-fit">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant" />
        </div>
        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {filteredSkills.length ? filteredSkills.map((skill) => {
            const selected = selectedIds.includes(skill.id);
            const visual = getDomainVisual(skill.domain);
            return (
              <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${selected ? "border-primary/40 bg-primary/10" : "border-white/5 bg-surface-container/40 hover:bg-white/[0.04]"}`}>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high ${visual.accentClass}`}>
                  <span className="material-symbols-outlined text-[20px]">{visual.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{skill.title}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{skill.domain} - {skill.source === "uploaded" ? labels.uploaded : labels.library}</span>
                </span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${selected ? "bg-error/15 text-error" : "bg-primary/15 text-primary"}`}>
                  <span className="material-symbols-outlined text-[18px]">{selected ? "remove" : "add"}</span>
                </span>
              </button>
            );
          }) : (
            <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-on-surface-variant">{labels.emptySkills}</p>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <button type="button" onClick={save} disabled={isSaving || !canSave} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-4 font-bold text-on-primary-container transition disabled:opacity-50">
          <span className="material-symbols-outlined text-[20px]">save</span>
          {isSaving ? labels.saving : labels.save}
        </button>
      </aside>
    </section>
  );
}
