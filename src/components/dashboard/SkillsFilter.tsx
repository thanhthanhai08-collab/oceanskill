"use client";

import {useState, useMemo} from "react";
import type {CreatorSkill} from "@/lib/skills/creator";

interface SkillsFilterProps {
  readonly skills: CreatorSkill[];
  readonly renderSkill: (skill: CreatorSkill) => React.ReactNode;
  readonly labels: {searchPlaceholder: string; filterAll: string; filterActive: string; filterDraft: string; empty: string};
}

export default function SkillsFilter({skills, renderSkill, labels}: SkillsFilterProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchesQuery =
        query.trim() === "" ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [skills, query, statusFilter]);

  const filters: Array<{value: typeof statusFilter; label: string}> = [
    {value: "all", label: labels.filterAll},
    {value: "active", label: labels.filterActive},
    {value: "draft", label: labels.filterDraft},
  ];

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/30 transition focus:border-primary/50 focus:ring-2"
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === f.value
                  ? "bg-primary/10 text-primary"
                  : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
          {labels.empty}
        </p>
      ) : (
        <div className="space-y-3">{filtered.map(renderSkill)}</div>
      )}
    </div>
  );
}
