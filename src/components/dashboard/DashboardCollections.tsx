"use client";

import {useEffect, useMemo, useState} from "react";
import type {CreatorSkill, LibrarySkill} from "@/lib/skills/creator";
import {getDomainVisual} from "@/data/mockData";

type SkillItem = Readonly<{
  id: string;
  title: string;
  description: string;
  domain: string;
  source: "library" | "uploaded";
}>;

type CollectionItem = Readonly<{
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  accent: "primary" | "secondary" | "tertiary";
  updatedAt: string;
}>;

const STORAGE_KEY = "oceanskill.dashboard.collections.v1";
const ACCENTS: CollectionItem["accent"][] = ["primary", "secondary", "tertiary"];

function buildStarterCollections(skills: SkillItem[]): CollectionItem[] {
  const byDomain = new Map<string, SkillItem[]>();
  for (const skill of skills) byDomain.set(skill.domain, [...(byDomain.get(skill.domain) ?? []), skill]);
  const groups = [...byDomain.entries()].filter(([, items]) => items.length > 0).slice(0, 3);
  return groups.map(([domain, items], index) => ({
    id: `starter-${domain}`,
    name: domain === "marketing" ? "Dự án Marketing" : domain === "development" ? "Hỗ trợ Lập trình" : `Bộ ${domain}`,
    description: items.slice(0, 3).map((item) => item.title).join(", "),
    skillIds: items.map((item) => item.id),
    accent: ACCENTS[index % ACCENTS.length],
    updatedAt: new Date().toISOString(),
  }));
}

function accentClasses(accent: CollectionItem["accent"]) {
  if (accent === "secondary") return {text: "text-secondary", bg: "bg-secondary/15", border: "hover:border-secondary/45"};
  if (accent === "tertiary") return {text: "text-tertiary", bg: "bg-tertiary/15", border: "hover:border-tertiary/45"};
  return {text: "text-primary", bg: "bg-primary/15", border: "hover:border-primary/45"};
}

export default function DashboardCollections({library, uploaded, locale}: {
  readonly library: LibrarySkill[];
  readonly uploaded: CreatorSkill[];
  readonly locale: string;
}) {
  const skills = useMemo<SkillItem[]>(() => [
    ...library.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, domain: skill.domain, source: "library" as const})),
    ...uploaded.map((skill) => ({id: skill.id, title: skill.title, description: skill.description, domain: skill.domain, source: "uploaded" as const})),
  ], [library, uploaded]);

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CollectionItem[];
        setCollections(parsed);
        return;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setCollections(buildStarterCollections(skills));
  }, [skills]);

  useEffect(() => {
    if (collections.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const date = new Intl.RelativeTimeFormat(locale, {numeric: "auto"});

  const toggleSkill = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const createCollection = () => {
    const collectionSkills = selectedIds.length ? selectedIds : skills.slice(0, 4).map((skill) => skill.id);
    if (!name.trim() || collectionSkills.length === 0) return;
    const item: CollectionItem = {
      id: `collection-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Nhóm skills theo dự án hoặc chủ đề làm việc.",
      skillIds: collectionSkills,
      accent: ACCENTS[collections.length % ACCENTS.length],
      updatedAt: new Date().toISOString(),
    };
    setCollections((current) => [item, ...current]);
    setName("");
    setDescription("");
    setSelectedIds([]);
  };

  const removeCollection = (id: string) => setCollections((current) => current.filter((item) => item.id !== id));

  return (
    <section className="mt-12 space-y-8 pb-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => {
            const classes = accentClasses(collection.accent);
            const collectionSkills = collection.skillIds.map((id) => skillMap.get(id)).filter(Boolean) as SkillItem[];
            return (
              <article key={collection.id} className={`group rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1 ${classes.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-24 w-24 shrink-0 grid-cols-2 gap-2 rounded-xl bg-surface-container p-2">
                    {collectionSkills.slice(0, 4).map((skill) => {
                      const visual = getDomainVisual(skill.domain);
                      return (
                        <span key={skill.id} className={`flex items-center justify-center rounded-lg ${classes.bg} ${visual.accentClass}`}>
                          <span className="material-symbols-outlined text-[18px]">{visual.icon}</span>
                        </span>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => removeCollection(collection.id)} className="rounded-lg p-1 text-on-surface-variant transition hover:bg-white/5 hover:text-error" aria-label="Xóa bộ sưu tập">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
                <h2 className="mt-8 font-geist text-2xl font-bold tracking-tight">{collection.name}</h2>
                <p className="mt-2 min-h-10 text-sm leading-5 text-on-surface-variant">{collection.skillIds.length} skills • {collection.description}</p>
                <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  {date.format(-2, "day")}
                </p>
                <div className="mt-6 border-t border-white/5 pt-5">
                  <button type="button" className={`font-bold ${classes.text}`}>Mở bộ sưu tập</button>
                </div>
              </article>
            );
          })}

          <article className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-surface-container-low/30 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <h2 className="mt-6 font-geist text-2xl font-bold">Thêm bộ sưu tập mới</h2>
            <p className="mt-3 max-w-56 text-sm leading-6 text-on-surface-variant">Bắt đầu phân loại kỹ năng cho dự án tiếp theo của bạn.</p>
          </article>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-surface-container-low/65 p-5">
          <h2 className="font-geist text-xl font-bold">Tạo bộ sưu tập mới</h2>
          <div className="mt-5 space-y-3">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên bộ sưu tập" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary/50" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn" rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary/50" />
          </div>
          <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
            {skills.map((skill) => (
              <label key={skill.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-surface-container/40 p-3 text-sm transition hover:bg-white/[0.04]">
                <input type="checkbox" checked={selectedIds.includes(skill.id)} onChange={() => toggleSkill(skill.id)} className="mt-1 accent-primary" />
                <span>
                  <span className="block font-semibold">{skill.title}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{skill.domain} • {skill.source === "uploaded" ? "Tự đăng" : "Nền tảng"}</span>
                </span>
              </label>
            ))}
          </div>
          <button type="button" onClick={createCollection} disabled={!name.trim() || skills.length === 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-4 font-bold text-on-primary-container transition hover:scale-[1.01] disabled:scale-100 disabled:opacity-50">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Tạo bộ sưu tập mới
          </button>
        </aside>
      </div>
    </section>
  );
}
