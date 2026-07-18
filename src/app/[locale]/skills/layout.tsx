import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import SkillsCatalogLayout from "@/components/skills/SkillsCatalogLayout";
import {listPublicCategories} from "@/lib/catalog/categories";
import {listPublicSkills} from "@/lib/catalog/skills";
import {getPlatformSkillCollections} from "@/lib/skills/collections";

export const dynamic = "force-dynamic";

type SkillsLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function SkillsLayout({children, params}: SkillsLayoutProps) {
  const {locale} = await params;
  const [skills, allCategories, platformCollections, t] = await Promise.all([
    listPublicSkills(locale),
    listPublicCategories(locale),
    getPlatformSkillCollections(locale),
    getTranslations({locale, namespace: "Marketplace"}),
  ]);
  const availableCategorySlugs = new Set(skills.map((skill) => skill.category));
  const categories = allCategories.filter((category) => availableCategorySlugs.has(category.slug));

  return (
    <SiteShell>
      <SkillsCatalogLayout
        categories={categories}
        platformCollections={platformCollections}
        labels={{
          categories: t("categories"),
          allCategories: t("allCategories"),
          platformCollections: t("collectionEyebrow"),
          trending: t("trending"),
        }}
      >
        {children}
      </SkillsCatalogLayout>
    </SiteShell>
  );
}
