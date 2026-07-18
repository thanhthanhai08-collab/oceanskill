"use client";

import {Link, usePathname} from "@/i18n/navigation";
import type {CatalogCategory} from "@/lib/catalog/categories";
import type {SkillCollection} from "@/lib/skills/collections";

export type CategorySidebarLabels = Readonly<{
  categories: string;
  allCategories: string;
  platformCollections: string;
  trending: string;
}>;

export interface CategorySidebarProps {
  readonly categories: CatalogCategory[];
  readonly platformCollections: SkillCollection[];
  readonly labels: CategorySidebarLabels;
}

export default function CategorySidebar({categories, platformCollections, labels}: CategorySidebarProps) {
  const pathname = usePathname();
  const activeCategory = pathname === "/skills" ? "all" : pathname.match(/^\/skills\/category\/([^/]+)\/?$/)?.[1];
  const activeCollection = pathname.match(/^\/skills\/collections\/([^/]+)\/?$/)?.[1];

  return (
    <aside className="space-y-10 lg:sticky lg:top-28 lg:h-fit">
      <section>
        <h2 className="font-geist text-xl font-semibold">{labels.categories}</h2>
        <nav aria-label={labels.categories} className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          <Link
            href="/skills"
            aria-current={activeCategory === "all" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition ${activeCategory === "all" ? "bg-primary/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container"}`}
          >
            {labels.allCategories}
          </Link>
          {categories.map((category) => {
            const active = activeCategory === category.slug;
            return (
              <Link
                key={category.slug}
                href={`/skills/category/${category.slug}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>
      </section>
      {platformCollections.length > 0 && <section>
        <h2 className="font-geist text-xl font-semibold">{labels.platformCollections}</h2>
        <nav aria-label={labels.platformCollections} className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          {platformCollections.map((collection) => {
            const active = activeCollection === collection.slug;
            return <Link
              key={collection.id}
              href={`/skills/collections/${collection.slug}` as "/skills"}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              {collection.name}
            </Link>;
          })}
        </nav>
      </section>}
      <section className="hidden lg:block">
        <h2 className="flex items-center gap-2 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-secondary">local_fire_department</span>{labels.trending}</h2>
        <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
          {categories.slice(0, 3).map((category) => <p key={category.slug} className="flex items-center justify-between"><span>{category.name}</span><span className="material-symbols-outlined text-[16px] text-tertiary">trending_up</span></p>)}
        </div>
      </section>
    </aside>
  );
}
