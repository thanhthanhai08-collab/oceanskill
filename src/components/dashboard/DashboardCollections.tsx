"use client";

import {useMemo, useState} from "react";
import type {CreatorSkill, LibrarySkill} from "@/lib/skills/creator";
import type {SkillCollection} from "@/lib/skills/collections";
import {getCategoryVisual} from "@/data/mockData";
import {getCollectionDetailHref, isStarterCollectionId, isValidCollectionSlug, slugifyCollectionName} from "@/lib/skills/collectionSlug";

type CollectionTab = "all" | "platform" | "personal";

type SkillItem = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  source: "library" | "uploaded";
}>;

type Labels = Readonly<{
  addNew: string;
  addHint: string;
  createTitle: string;
  namePlaceholder: string;
  slugPlaceholder: string;
  slugHint: string;
  descriptionPlaceholder: string;
  searchPlaceholder: string;
  emptySkills: string;
  creating: string;
  create: string;
  library: string;
  uploaded: string;
  suggested: string;
  open: string;
  delete: string;
  skillCount: string;
  duplicateError: string;
  defaultDescription: string;
  starterMarketing: string;
  starterDevelopment: string;
  starterSet: string;
  close: string;
  platformBadge?: string;
  platformTitle?: string;
  platformDescription?: string;
  platformAdd?: string;
  platformAdded?: string;
  readOnly?: string;
  personalTitle?: string;
  personalDescription?: string;
  tabAll: string;
  tabPlatform: string;
  tabPersonal: string;
  emptyPlatform: string;
  emptyPersonal: string;
}>;

const ACCENTS: SkillCollection["accent"][] = ["primary", "secondary", "tertiary"];

function buildStarterCollections(skills: SkillItem[], labels: Labels): SkillCollection[] {
  const byDomain = new Map<string, SkillItem[]>();
  for (const skill of skills) byDomain.set(skill.category, [...(byDomain.get(skill.category) ?? []), skill]);
  const groups = [...byDomain.entries()].filter(([, items]) => items.length > 0).slice(0, 3);
  return groups.map(([category, items], index) => ({
    id: `starter-${category}`,
    slug: `starter-${category}`,
    name: category === "marketing" ? labels.starterMarketing : category === "development" ? labels.starterDevelopment : labels.starterSet.replace("{category}", category),
    description: items.slice(0, 3).map((item) => item.title).join(", "),
    skillIds: items.map((item) => item.id),
    accent: ACCENTS[index % ACCENTS.length],
    updatedAt: new Date().toISOString(),
    owned: false,
    collectionType: "user",
  }));
}

function accentClasses(accent: SkillCollection["accent"]) {
  if (accent === "secondary") return {text: "text-secondary", bg: "bg-secondary/15", border: "hover:border-secondary/45"};
  if (accent === "tertiary") return {text: "text-tertiary", bg: "bg-tertiary/15", border: "hover:border-tertiary/45"};
  return {text: "text-primary", bg: "bg-primary/15", border: "hover:border-primary/45"};
}

export default function DashboardCollections({
  library,
  uploaded,
  locale,
  initialCollections,
  labels,
}: {
  readonly library: LibrarySkill[];
  readonly uploaded: CreatorSkill[];
  readonly locale: string;
  readonly initialCollections: SkillCollection[];
  readonly labels: Labels;
}) {
  const skills = useMemo<SkillItem[]>(() => [
    ...library.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, category: skill.category, source: "library" as const})),
    ...uploaded.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, category: skill.category, source: "uploaded" as const})),
  ], [library, uploaded]);

  const [collections, setCollections] = useState<SkillCollection[]>(initialCollections);
  const [tab, setTab] = useState<CollectionTab>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const date = new Intl.RelativeTimeFormat(locale, {numeric: "auto"});
  const personalCollections = collections.filter((collection) => collection.collectionType === "user");
  const platformCollections = collections.filter((collection) => collection.collectionType === "platform");
  const selectedCollections = tab === "platform" ? platformCollections : tab === "personal" ? personalCollections : collections;
  const displayedCollections = selectedCollections.length ? selectedCollections : (tab !== "platform" && personalCollections.length === 0 ? buildStarterCollections(skills, labels) : []);
  const filteredSkills = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return skills;
    return skills.filter((skill) => [skill.title, skill.description, skill.category].some((value) => value.toLowerCase().includes(term)));
  }, [query, skills]);
  const canCreate = name.trim().length > 0 && isValidCollectionSlug(slug) && selectedIds.length > 0;

  const closeCreate = () => {
    if (isSaving) return;
    setIsCreateOpen(false);
  };

  const updateName = (value: string) => {
    setCreateError(null);
    setName(value);
    if (!isSlugDirty) setSlug(slugifyCollectionName(value));
  };

  const updateSlug = (value: string) => {
    setCreateError(null);
    setIsSlugDirty(true);
    setSlug(slugifyCollectionName(value));
  };

  const toggleSkill = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const createCollection = async () => {
    if (!canCreate) return;
    setCreateError(null);
    setIsSaving(true);
    const response = await fetch("/api/dashboard/collections", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        name: name.trim(),
        slug,
        description: description.trim() || labels.defaultDescription,
        skillIds: selectedIds,
      }),
    });
    setIsSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as {error?: string} | null;
      setCreateError(payload?.error === "collection_duplicate" ? labels.duplicateError : labels.duplicateError);
      return;
    }
    const payload = await response.json() as {collections?: SkillCollection[]; href?: string};
    setCollections(payload.collections ?? []);
    setName("");
    setDescription("");
    setSlug("");
    setIsSlugDirty(false);
    setQuery("");
    setSelectedIds([]);
    setIsCreateOpen(false);
    if (payload.href) window.location.assign(payload.href);
  };

  const removeCollection = async (id: string) => {
    const response = await fetch(`/api/dashboard/collections/${id}`, {method: "DELETE"});
    if (!response.ok) return;
    const payload = await response.json() as {collections?: SkillCollection[]};
    setCollections(payload.collections ?? []);
  };

  const createFromStarter = (collection: SkillCollection) => {
    setName(collection.name);
    setDescription(collection.description);
    setSlug(slugifyCollectionName(collection.name));
    setIsSlugDirty(false);
    setQuery("");
    setSelectedIds(collection.skillIds);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  return (
    <section className="mt-12 space-y-8 pb-12">
      <div role="tablist" className="flex items-center gap-8 overflow-x-auto border-b border-white/5">
        {([
          ["all", labels.tabAll, collections.length],
          ["platform", labels.tabPlatform, platformCollections.length],
          ["personal", labels.tabPersonal, personalCollections.length],
        ] as const).map(([key, label, count]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px flex whitespace-nowrap border-b-2 px-2 pb-4 text-sm font-bold transition ${tab === key ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}><span>{label}</span><span className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 font-mono text-[10px] ${tab === key ? "bg-primary/15 text-primary" : "bg-white/10"}`}>{count}</span></button>)}
      </div>
      {displayedCollections.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-on-surface-variant">{tab === "platform" ? labels.emptyPlatform : labels.emptyPersonal}</p>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {displayedCollections.map((collection) => {
          const classes = accentClasses(collection.accent);
          const collectionSkills = collection.skillIds.map((id) => skillMap.get(id)).filter(Boolean) as SkillItem[];
          const isStarter = isStarterCollectionId(collection.id);
          const detailHref = getCollectionDetailHref(locale, collection.id, collection.slug);
          return (
            <article key={collection.id} className={`group rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1 ${classes.border}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-24 w-24 shrink-0 grid-cols-2 gap-2 rounded-xl bg-surface-container p-2">
                  {collectionSkills.slice(0, 4).map((skill) => {
                    const visual = getCategoryVisual(skill.category);
                    return (
                      <span key={skill.id} className={`flex items-center justify-center rounded-lg ${classes.bg} ${visual.accentClass}`}>
                        <span className="material-symbols-outlined text-[18px]">{visual.icon}</span>
                      </span>
                    );
                  })}
                </div>
                <button type="button" onClick={() => removeCollection(collection.id)} disabled={isStarter || !collection.owned} className="rounded-lg p-1 text-on-surface-variant transition hover:bg-white/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-40" aria-label={labels.delete}>
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <h2 className="mt-8 font-geist text-2xl font-bold tracking-tight">{collection.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-5 text-on-surface-variant">{labels.skillCount.replace("{count}", String(collection.skillIds.length))} - {collection.description}</p>
              <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                {isStarter ? labels.suggested : date.format(-2, "day")}
              </p>
              <div className="mt-6 border-t border-white/5 pt-5">
                {!detailHref ? (
                  <button type="button" onClick={() => createFromStarter(collection)} className={`font-bold ${classes.text}`}>{labels.open}</button>
                ) : (
                  <a href={detailHref} className={`font-bold ${classes.text}`}>{labels.open}</a>
                )}
              </div>
            </article>
          );
        })}

        {tab !== "platform" && <button type="button" onClick={() => setIsCreateOpen(true)} className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-surface-container-low/30 p-8 text-center transition hover:border-primary/45 hover:bg-white/[0.04]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
            <span className="material-symbols-outlined text-3xl">add</span>
          </span>
          <span className="mt-6 font-geist text-2xl font-bold">{labels.addNew}</span>
          <span className="mt-3 max-w-56 text-sm leading-6 text-on-surface-variant">{labels.addHint}</span>
        </button>}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="create-collection-title" className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-surface-container-low p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="create-collection-title" className="font-geist text-2xl font-bold">{labels.createTitle}</h2>
              <button type="button" onClick={closeCreate} className="rounded-lg p-2 text-on-surface-variant transition hover:bg-white/5 hover:text-on-surface" aria-label={labels.close}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <input value={name} onChange={(event) => updateName(event.target.value)} placeholder={labels.namePlaceholder} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary/50" />
              <div>
                <input value={slug} onChange={(event) => updateSlug(event.target.value)} placeholder={labels.slugPlaceholder} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary/50" />
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{labels.slugHint}</p>
              </div>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={labels.descriptionPlaceholder} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary/50" />
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant" />
              </div>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                {filteredSkills.length ? filteredSkills.map((skill) => {
                  const selected = selectedIds.includes(skill.id);
                  const visual = getCategoryVisual(skill.category);
                  return (
                    <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${selected ? "border-primary/40 bg-primary/10" : "border-white/5 bg-surface-container/40 hover:bg-white/[0.04]"}`}>
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high ${visual.accentClass}`}>
                        <span className="material-symbols-outlined text-[20px]">{visual.icon}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{skill.title}</span>
                        <span className="mt-1 block text-xs text-on-surface-variant">{skill.category} - {skill.source === "uploaded" ? labels.uploaded : labels.library}</span>
                      </span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${selected ? "bg-error/15 text-error" : "bg-primary/15 text-primary"}`}>
                        <span className="material-symbols-outlined text-[18px]">{selected ? "remove" : "add"}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-on-surface-variant">{labels.emptySkills}</p>
                )}
              </div>
            </div>

            <button type="button" onClick={createCollection} disabled={isSaving || !canCreate} className="btn-payment mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold transition hover:scale-[1.01] disabled:scale-100 disabled:opacity-50">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              {isSaving ? labels.creating : labels.create}
            </button>
            {createError && <p className="mt-3 text-sm text-error">{createError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
