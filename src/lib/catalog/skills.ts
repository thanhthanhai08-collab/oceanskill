import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {platformSkillFallbacks} from "@/content/platform-skills";

export type SkillAuthor = {
  id: string; name: string; handle: string; icon: string; domain: string; glow_class: string;
  bio: string; focus: string[]; website_url: string | null; avatar_path: string | null; avatar_url: string | null;
};

export type SkillSummary = {
  id: string; slug: string; title: string; description: string; domain: string;
  compatible_clients: string[]; license_spdx: string | null; source_url: string | null; current_version: string | null; updated_at: string;
  author_id: string | null; authors: SkillAuthor | null;
};

const authorFields = "id,name,handle,icon,domain,glow_class,bio,focus,website_url,avatar_path,avatar_url";
const fields = `id,slug,title,description,domain,compatible_clients,license_spdx,source_url,current_version,updated_at,author_id,authors!inner(${authorFields})`;

type SkillRow = Omit<SkillSummary, "authors"> & {authors: SkillAuthor | SkillAuthor[] | null};

function normalizeSkill(row: SkillRow): SkillSummary {
  return {...row, authors: Array.isArray(row.authors) ? row.authors[0] ?? null : row.authors};
}

export async function listPublicSkills() {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).order("title").limit(50);
  if (error) throw new Error(`Could not load public skills: ${error.message}`);
  return data?.length ? (data as unknown as SkillRow[]).map(normalizeSkill) : platformSkillFallbacks;
}

export async function getPublicSkill(slug: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load public skill: ${error.message}`);
  return data ? normalizeSkill(data as unknown as SkillRow) : platformSkillFallbacks.find((skill) => skill.slug === slug) ?? null;
}

export async function listRelatedSkills(domain: string, excludeSlug: string, limit = 3) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).eq("domain", domain).neq("slug", excludeSlug).order("title").limit(limit);
  if (error) throw new Error(`Could not load related skills: ${error.message}`);
  const related = ((data ?? []) as unknown as SkillRow[]).map(normalizeSkill);
  return related.length ? related : platformSkillFallbacks.filter((skill) => skill.domain === domain && skill.slug !== excludeSlug).slice(0, limit);
}
