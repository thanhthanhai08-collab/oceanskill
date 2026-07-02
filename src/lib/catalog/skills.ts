import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export type SkillSummary = {
  id: string; slug: string; title: string; description: string; domain: string;
  compatible_clients: string[]; license_spdx: string | null; current_version: string | null; updated_at: string;
};

const fields = "id,slug,title,description,domain,compatible_clients,license_spdx,current_version,updated_at";

export async function listPublicSkills() {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").order("title").limit(50);
  if (error) throw new Error(`Could not load public skills: ${error.message}`);
  return (data ?? []) as SkillSummary[];
}

export async function getPublicSkill(slug: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load public skill: ${error.message}`);
  return data as SkillSummary | null;
}

export async function listRelatedSkills(domain: string, excludeSlug: string, limit = 3) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("domain", domain).neq("slug", excludeSlug).order("title").limit(limit);
  if (error) throw new Error(`Could not load related skills: ${error.message}`);
  return (data ?? []) as SkillSummary[];
}
