import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import SkillsCatalogLayout from "@/components/skills/SkillsCatalogLayout";
import {listPublicCategories} from "@/lib/catalog/categories";
import {listPublicSkills} from "@/lib/catalog/skills";

export const dynamic = "force-dynamic";

type SkillsLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function SkillsLayout({children, params}: SkillsLayoutProps) {
  const {locale} = await params;
  const [skills, allCategories, t] = await Promise.all([
    listPublicSkills(locale),
    listPublicCategories(locale),
    getTranslations({locale, namespace: "Marketplace"}),
  ]);
  const availableCategorySlugs = new Set(skills.map((skill) => skill.category));
  const categories = allCategories.filter((category) => availableCategorySlugs.has(category.slug));

  return (
    <SiteShell>
      <SkillsCatalogLayout
        skills={skills}
        categories={categories}
        labels={{
          categories: t("categories"),
          allCategories: t("allCategories"),
          catalogRank: t("catalogRank"),
          trending: t("trending"),
        }}
      >
        {children}
      </SkillsCatalogLayout>
    </SiteShell>
  );
}
