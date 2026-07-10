import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export type SkillFaq = Readonly<{id: string; question: string; answer: string; sort_order: number}>;

export async function listSkillFaqs(skillId: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skill_faqs").select("id,question,answer,sort_order").eq("skill_id", skillId).eq("is_published", true).order("sort_order").limit(3);
  if (error) throw new Error(`Could not load skill FAQs: ${error.message}`);
  return (data ?? []) as SkillFaq[];
}
