import "server-only";
import {createClient} from "@/lib/supabase/server";
import type {SkillAuthor} from "@/lib/catalog/skills";

const authorFields = "id,name,handle,icon,domain,glow_class,bio,focus,website_url,avatar_path,avatar_url";

export type CreatorSkill = Readonly<{
  id: string; slug: string; title: string; description: string; domain: string; status: string;
  visibility: string; current_version: string | null; compatible_clients: string[]; updated_at: string;
  author_id: string | null; authors: SkillAuthor | null;
  skill_versions: Array<{version: string; scan_status: string; content_hash: string; scan_summary: Record<string, unknown>; created_at: string}>;
}>;

export type FoundationSkill = Readonly<{
  id: string; slug: string; title: string; description: string; domain: string;
  status: string; current_version: string | null; compatible_clients: string[]; updated_at: string;
  author_id: string | null; authors: SkillAuthor | null;
}>;

export type LibrarySkill = FoundationSkill & Readonly<{added_at: string}>;

type WithAuthorArray<T> = Omit<T, "authors"> & {authors: SkillAuthor | SkillAuthor[] | null};
type SkillTranslationRow = Readonly<{skill_id: string; locale: string; title: string; description: string}>;

function normalizeAuthor<T extends {authors: SkillAuthor | null}>(skill: WithAuthorArray<T>): T {
  return {...skill, authors: Array.isArray(skill.authors) ? skill.authors[0] ?? null : skill.authors} as T;
}

async function localizeFoundationSkills<T extends FoundationSkill>(skills: T[], locale?: string) {
  if (!locale || !skills.length) return skills;
  const supabase = await createClient();
  const locales = locale === "en" ? ["en"] : [locale, "en"];
  const {data, error} = await supabase
    .from("skill_translations")
    .select("skill_id,locale,title,description")
    .in("skill_id", skills.map((skill) => skill.id))
    .in("locale", locales);
  if (error) return skills;
  const bySkillId = new Map<string, SkillTranslationRow>();
  for (const row of (data ?? []) as SkillTranslationRow[]) {
    const existing = bySkillId.get(row.skill_id);
    if (!existing || (existing.locale !== locale && row.locale === locale)) bySkillId.set(row.skill_id, row);
  }
  return skills.map((skill) => {
    const translation = bySkillId.get(skill.id);
    return translation ? {...skill, title: translation.title, description: translation.description} : skill;
  });
}

/** Fetch all skills owned by the current user (private + published). */
export async function getCreatorSkills() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const [skillsResult, profileResult] = await Promise.all([
    supabase.from("skills")
    .select(`id,slug,title,description,domain,status,visibility,current_version,compatible_clients,updated_at,author_id,authors(${authorFields}),skill_versions!skill_versions_skill_id_fkey(version,scan_status,content_hash,scan_summary,created_at)`)
    .eq("owner_id", String(userId)).order("updated_at", {ascending: false}),
    supabase.from("profiles").select("creator_skill_limit").eq("id", String(userId)).maybeSingle(),
  ]);
  if (skillsResult.error) throw new Error(`Could not load creator skills: ${skillsResult.error.message}`);
  if (profileResult.error) throw new Error(`Could not load creator limit: ${profileResult.error.message}`);
  return {claims: claimsData.claims, skills: ((skillsResult.data ?? []) as unknown as Array<WithAuthorArray<CreatorSkill>>).map(normalizeAuthor), limit: Number(profileResult.data?.creator_skill_limit ?? 5)};
}

/** Count how many skills the current user has uploaded (for free-plan limit enforcement). */
export async function getUserSkillCount() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return 0;
  const {count} = await supabase.from("skills")
    .select("id", {count: "exact", head: true})
    .eq("owner_id", String(userId));
  return count ?? 0;
}

/** Fetch curated platform/foundation skills (no owner, or owner_id is null). */
export async function getFoundationSkills(locale?: string) {
  const supabase = await createClient();
  const {data, error} = await supabase.from("skills")
    .select(`id,slug,title,description,domain,status,current_version,compatible_clients,updated_at,author_id,authors(${authorFields})`)
    .is("owner_id", null)
    .eq("status", "active")
    .order("updated_at", {ascending: false});
  if (error) throw new Error(`Could not load foundation skills: ${error.message}`);
  return localizeFoundationSkills(((data ?? []) as unknown as Array<WithAuthorArray<FoundationSkill>>).map(normalizeAuthor), locale);
}

export async function getUserSkillLibrary(locale?: string) {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return null;
  const {data, error} = await supabase.from("user_skill_library")
    .select(`added_at,skills!inner(id,slug,title,description,domain,status,current_version,compatible_clients,updated_at,author_id,authors(${authorFields}))`)
    .eq("user_id", String(claimsData.claims.sub)).order("added_at", {ascending: false});
  if (error) throw new Error(`Could not load user skill library: ${error.message}`);
  return localizeFoundationSkills((data ?? []).map((row) => normalizeAuthor({...((Array.isArray(row.skills) ? row.skills[0] : row.skills) as unknown as WithAuthorArray<FoundationSkill>), added_at: row.added_at} as WithAuthorArray<LibrarySkill>)), locale);
}
