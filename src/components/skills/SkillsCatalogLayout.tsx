"use client";

import {usePathname} from "@/i18n/navigation";
import type {CatalogCategory} from "@/lib/catalog/categories";
import type {SkillSummary} from "@/lib/catalog/skills";
import CategorySidebar, {type CategorySidebarLabels} from "@/components/skills/CategorySidebar";

type SkillsCatalogLayoutProps = Readonly<{
  children: React.ReactNode;
  skills: SkillSummary[];
  categories: CatalogCategory[];
  labels: CategorySidebarLabels;
}>;

export default function SkillsCatalogLayout({children, skills, categories, labels}: SkillsCatalogLayoutProps) {
  const pathname = usePathname();
  const isCatalogPage = pathname === "/skills" || pathname.startsWith("/skills/category/");

  if (!isCatalogPage) return children;

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
      <CategorySidebar skills={skills} categories={categories} labels={labels} />
      <div className="min-w-0">{children}</div>
    </main>
  );
}
