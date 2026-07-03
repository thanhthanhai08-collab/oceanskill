import "server-only";
import {createClient} from "@/lib/supabase/server";

export type CreatorSkill = Readonly<{
  id: string; slug: string; title: string; description: string; domain: string; status: string;
  visibility: string; current_version: string | null; compatible_clients: string[]; updated_at: string;
  skill_versions: Array<{version: string; scan_status: string; content_hash: string; scan_summary: Record<string, unknown>; created_at: string}>;
}>;

export type FoundationSkill = Readonly<{
  id: string; slug: string; title: string; description: string; domain: string;
  status: string; current_version: string | null; compatible_clients: string[]; updated_at: string;
}>;

export type LibrarySkill = FoundationSkill & Readonly<{added_at: string}>;

/** Fetch all skills owned by the current user (private + published). */
export async function getCreatorSkills() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const [skillsResult, profileResult] = await Promise.all([
    supabase.from("skills")
    .select("id,slug,title,description,domain,status,visibility,current_version,compatible_clients,updated_at,skill_versions(version,scan_status,content_hash,scan_summary,created_at)")
    .eq("owner_id", String(userId)).order("updated_at", {ascending: false}),
    supabase.from("profiles").select("creator_skill_limit").eq("id", String(userId)).maybeSingle(),
  ]);
  if (skillsResult.error) throw new Error(`Could not load creator skills: ${skillsResult.error.message}`);
  if (profileResult.error) throw new Error(`Could not load creator limit: ${profileResult.error.message}`);
  return {claims: claimsData.claims, skills: (skillsResult.data ?? []) as CreatorSkill[], limit: Number(profileResult.data?.creator_skill_limit ?? 5)};
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
export async function getFoundationSkills() {
  const supabase = await createClient();
  const {data, error} = await supabase.from("skills")
    .select("id,slug,title,description,domain,status,current_version,compatible_clients,updated_at")
    .is("owner_id", null)
    .eq("status", "active")
    .order("updated_at", {ascending: false});
  if (error) throw new Error(`Could not load foundation skills: ${error.message}`);
  return (data ?? []) as FoundationSkill[];
}

export async function getUserSkillLibrary() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return null;
  const {data, error} = await supabase.from("user_skill_library")
    .select("added_at,skills!inner(id,slug,title,description,domain,status,current_version,compatible_clients,updated_at)")
    .eq("user_id", String(claimsData.claims.sub)).order("added_at", {ascending: false});
  if (error) throw new Error(`Could not load user skill library: ${error.message}`);
  return (data ?? []).map((row) => ({...(Array.isArray(row.skills) ? row.skills[0] : row.skills), added_at: row.added_at})) as LibrarySkill[];
}
