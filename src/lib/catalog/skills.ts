import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {platformSkillFallbacks} from "@/content/platform-skills";

export type SkillSummary = {
  id: string; slug: string; title: string; description: string; domain: string;
  compatible_clients: string[]; license_spdx: string | null; source_url: string | null; current_version: string | null; updated_at: string;
};

const fields = "id,slug,title,description,domain,compatible_clients,license_spdx,source_url,current_version,updated_at";

export async function listPublicSkills() {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").order("title").limit(50);
  if (error) throw new Error(`Could not load public skills: ${error.message}`);
  return data?.length ? data as SkillSummary[] : platformSkillFallbacks;
}

export async function getPublicSkill(slug: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load public skill: ${error.message}`);
  return (data as SkillSummary | null) ?? platformSkillFallbacks.find((skill) => skill.slug === slug) ?? null;
}

export async function listRelatedSkills(domain: string, excludeSlug: string, limit = 3) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("domain", domain).neq("slug", excludeSlug).order("title").limit(limit);
  if (error) throw new Error(`Could not load related skills: ${error.message}`);
  const related = (data ?? []) as SkillSummary[];
  return related.length ? related : platformSkillFallbacks.filter((skill) => skill.domain === domain && skill.slug !== excludeSlug).slice(0, limit);
}
