import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export type SkillFaq = Readonly<{id: string; locale?: string; question: string; answer: string; sort_order: number}>;

export async function listSkillFaqs(skillId: string, locale?: string) {
  const supabase = createPublicClient();
  const locales = locale === "en" ? ["en"] : [locale ?? "en", "en"];
  const {data, error} = await supabase.from("skill_faqs").select("id,locale,question,answer,sort_order").eq("skill_id", skillId).eq("is_published", true).in("locale", locales).order("sort_order").limit(6);
  if (error) throw new Error(`Could not load skill FAQs: ${error.message}`);
  const rows = (data ?? []) as SkillFaq[];
  const byOrder = new Map<number, SkillFaq>();
  for (const row of rows) {
    const existing = byOrder.get(row.sort_order);
    if (!existing || (existing.locale !== locale && row.locale === locale)) byOrder.set(row.sort_order, row);
  }
  return [...byOrder.values()].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3);
}
