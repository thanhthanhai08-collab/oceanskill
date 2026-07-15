import {Link} from "@/i18n/navigation";
import type {SkillSummary} from "@/lib/catalog/skills";
import type {CatalogCategory} from "@/lib/catalog/categories";

export interface MarketplaceSidebarProps {
  readonly skills: SkillSummary[];
  readonly categories: CatalogCategory[];
  readonly activeCategory: string;
  readonly labels: Readonly<{
    categories: string;
    allCategories: string;
    catalogRank: string;
    trending: string;
  }>;
}

export default function MarketplaceSidebar({skills, categories, activeCategory, labels}: MarketplaceSidebarProps) {
  return (
    <aside className="space-y-10 lg:sticky lg:top-28 lg:h-fit">
      <section>
        <h2 className="font-geist text-xl font-semibold">{labels.categories}</h2>
        <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          <Link href="/skills" className={`rounded-lg px-3 py-2 text-sm transition ${activeCategory === "all" ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:bg-surface-container"}`}>{labels.allCategories}</Link>
          {categories.map((category) => <Link key={category.slug} href={`/skills/category/${category.slug}`} className={`rounded-lg px-3 py-2 text-sm transition ${activeCategory === category.slug ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:bg-surface-container"}`}>{category.name}</Link>)}
        </div>
      </section>
      <section className="hidden lg:block">
        <h2 className="font-geist text-xl font-semibold">{labels.catalogRank}</h2>
        <div className="mt-4 space-y-3">
          {skills.slice(0, 3).map((skill, index) => (
            <Link key={skill.id} href={`/skills/${skill.slug}`} className="flex items-center gap-4 rounded-xl border border-outline-variant/35 bg-surface-container-low/60 p-4 transition hover:border-primary/50">
              <span className={`font-geist text-2xl font-bold ${index === 0 ? "text-tertiary" : "text-on-surface-variant"}`}>{index + 1}</span>
              <span className="min-w-0"><span className="block truncate font-semibold">{skill.title}</span><span className="mt-1 block font-mono text-[10px] uppercase text-on-surface-variant">{skill.compatible_clients.length} integrations</span></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="hidden lg:block">
        <h2 className="flex items-center gap-2 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-secondary">local_fire_department</span>{labels.trending}</h2>
        <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
          {categories.slice(0, 3).map((category) => <p key={category.slug} className="flex items-center justify-between"><span>{category.name}</span><span className="material-symbols-outlined text-[16px] text-tertiary">trending_up</span></p>)}
        </div>
      </section>
    </aside>
  );
}
