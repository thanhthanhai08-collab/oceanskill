import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export type CatalogCategory = Readonly<{
  slug: string;
  icon: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}>;

type CategoryRow = Readonly<{slug: string; icon: string}>;
type CategoryTranslationRow = Readonly<{
  category_slug: string;
  locale: string;
  name: string;
  description: string;
  seo_title: string;
  seo_description: string;
}>;

function chooseTranslation(rows: CategoryTranslationRow[], locale: string) {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en");
}

export async function listPublicCategories(locale = "en"): Promise<CatalogCategory[]> {
  const supabase = createPublicClient();
  const locales = locale === "en" ? ["en"] : [locale, "en"];
  const [categoriesResult, translationsResult] = await Promise.all([
    supabase.from("categories").select("slug,icon").order("sort_order"),
    supabase.from("category_translations").select("category_slug,locale,name,description,seo_title,seo_description").in("locale", locales),
  ]);
  if (categoriesResult.error) throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  if (translationsResult.error) throw new Error(`Could not load category translations: ${translationsResult.error.message}`);

  const translations = (translationsResult.data ?? []) as CategoryTranslationRow[];
  return ((categoriesResult.data ?? []) as CategoryRow[]).flatMap((category) => {
    const copy = chooseTranslation(translations.filter((row) => row.category_slug === category.slug), locale);
    return copy ? [{slug: category.slug, icon: category.icon, name: copy.name, description: copy.description, seoTitle: copy.seo_title, seoDescription: copy.seo_description}] : [];
  });
}

export async function getPublicCategory(slug: string, locale = "en") {
  const categories = await listPublicCategories(locale);
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function listSkillTagNames(skillId: string, locale = "en") {
  const supabase = createPublicClient();
  const {data, error} = await supabase
    .from("skill_tags")
    .select("tags!inner(name_en,name_vi)")
    .eq("skill_id", skillId);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (!tag) return [];
    return [locale === "vi" ? tag.name_vi : tag.name_en];
  });
}
