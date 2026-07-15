import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {platformSkillFallbacks} from "@/content/platform-skills";

export type SkillAuthor = {
  id: string; name: string; handle: string; icon: string; category: string; glow_class: string;
  bio: string; focus: string[]; website_url: string | null; avatar_path: string | null; avatar_url: string | null;
};

export type SkillSummary = {
  id: string; slug: string; title: string; description: string; category: string;
  compatible_clients: string[]; license_spdx: string | null; source_url: string | null; current_version: string | null; updated_at: string;
  author_id: string | null; authors: SkillAuthor | null;
};

const authorFields = "id,name,handle,icon,category,glow_class,bio,focus,website_url,avatar_path,avatar_url";
const fields = `id,slug,title,description,category,compatible_clients,license_spdx,source_url,current_version,updated_at,author_id,authors!inner(${authorFields})`;

type SkillRow = Omit<SkillSummary, "authors"> & {authors: SkillAuthor | SkillAuthor[] | null};
type SkillTranslationRow = Readonly<{skill_id: string; locale: string; title: string; description: string}>;

function normalizeSkill(row: SkillRow): SkillSummary {
  return {...row, authors: Array.isArray(row.authors) ? row.authors[0] ?? null : row.authors};
}

async function localizeSkills(skills: SkillSummary[], locale?: string) {
  if (!locale || !skills.length) return skills;
  const supabase = createPublicClient();
  const locales = locale === "en" ? ["en"] : [locale, "en"];
  const {data, error} = await supabase
    .from("skill_translations")
    .select("skill_id,locale,title,description")
    .in("skill_id", skills.map((skill) => skill.id))
    .in("locale", locales);
  if (error) return skills;
  const rows = (data ?? []) as SkillTranslationRow[];
  const bySkillId = new Map<string, SkillTranslationRow>();
  for (const row of rows) {
    const existing = bySkillId.get(row.skill_id);
    if (!existing || (existing.locale !== locale && row.locale === locale)) bySkillId.set(row.skill_id, row);
  }
  return skills.map((skill) => {
    const translation = bySkillId.get(skill.id);
    return translation ? {...skill, title: translation.title, description: translation.description} : skill;
  });
}

export async function listPublicSkills(locale?: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).order("title").limit(50);
  if (error) throw new Error(`Could not load public skills: ${error.message}`);
  const skills = data?.length ? (data as unknown as SkillRow[]).map(normalizeSkill) : platformSkillFallbacks;
  return localizeSkills(skills, locale);
}

export async function getPublicSkill(slug: string, locale?: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load public skill: ${error.message}`);
  const skill = data ? normalizeSkill(data as unknown as SkillRow) : platformSkillFallbacks.find((item) => item.slug === slug) ?? null;
  if (!skill) return null;
  const [localized] = await localizeSkills([skill], locale);
  return localized;
}

export async function listRelatedSkills(category: string, excludeSlug: string, limit = 3, locale?: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).eq("category", category).neq("slug", excludeSlug).order("title").limit(limit);
  if (error) throw new Error(`Could not load related skills: ${error.message}`);
  const related = ((data ?? []) as unknown as SkillRow[]).map(normalizeSkill);
  return localizeSkills(related.length ? related : platformSkillFallbacks.filter((skill) => skill.category === category && skill.slug !== excludeSlug).slice(0, limit), locale);
}

export async function listSkillsByAuthor(authorId: string | null, excludeSlug: string, limit = 2, locale?: string) {
  if (!authorId) return [];
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("skills").select(fields).eq("status", "active").eq("visibility", "public").eq("authors.verified", true).eq("author_id", authorId).neq("slug", excludeSlug).order("title").limit(limit);
  if (error) throw new Error(`Could not load author skills: ${error.message}`);
  const authorSkills = ((data ?? []) as unknown as SkillRow[]).map(normalizeSkill);
  return localizeSkills(authorSkills.length ? authorSkills : platformSkillFallbacks.filter((skill) => skill.author_id === authorId && skill.slug !== excludeSlug).slice(0, limit), locale);
}
