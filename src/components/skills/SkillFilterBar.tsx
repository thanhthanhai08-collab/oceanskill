export type SkillFilterBarLabels = Readonly<{
  searchPlaceholder: string;
  sortFeatured: string;
  sortCategory: string;
  sortVersion: string;
  filter: string;
}>;

type SkillFilterBarProps = Readonly<{
  query: string;
  sort: string;
  labels: SkillFilterBarLabels;
}>;

export default function SkillFilterBar({query, sort, labels}: SkillFilterBarProps) {
  return (
    <form className="grid gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-4 md:grid-cols-[1fr_190px_auto]">
      <label className="relative">
        <span className="sr-only">{labels.searchPlaceholder}</span>
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
        <input name="q" defaultValue={query} placeholder={labels.searchPlaceholder} className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-3 pl-11 pr-4 outline-none transition focus:border-primary" />
      </label>
      <select name="sort" defaultValue={sort} className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary">
        <option value="featured">{labels.sortFeatured}</option>
        <option value="category">{labels.sortCategory}</option>
        <option value="version">{labels.sortVersion}</option>
      </select>
      <button className="rounded-lg bg-primary-container px-6 py-3 font-semibold text-white transition hover:bg-inverse-primary">{labels.filter}</button>
    </form>
  );
}
