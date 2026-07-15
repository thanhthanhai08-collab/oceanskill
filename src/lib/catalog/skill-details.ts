import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export type SkillDetailContent = Readonly<{
  locale?: string;
  headline: string;
  overview: string;
  feature_one_title: string;
  feature_one_description: string;
  feature_two_title: string;
  feature_two_description: string;
}>;

export async function getSkillDetailContent(skillId: string, locale?: string) {
  const supabase = createPublicClient();
  const locales = locale === "en" ? ["en"] : [locale ?? "en", "en"];
  const {data, error} = await supabase
    .from("skill_details")
    .select("locale,headline,overview,feature_one_title,feature_one_description,feature_two_title,feature_two_description")
    .eq("skill_id", skillId)
    .in("locale", locales);
  if (error) throw new Error(`Could not load skill detail content: ${error.message}`);
  const rows = (data ?? []) as Array<SkillDetailContent & {locale?: string}>;
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en") ?? rows[0] ?? null;
}
