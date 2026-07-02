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

/** Fetch all skills owned by the current user (private + published). */
export async function getCreatorSkills() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const {data, error} = await supabase.from("skills")
    .select("id,slug,title,description,domain,status,visibility,current_version,compatible_clients,updated_at,skill_versions(version,scan_status,content_hash,scan_summary,created_at)")
    .eq("owner_id", String(userId)).order("updated_at", {ascending: false});
  if (error) throw new Error(`Could not load creator skills: ${error.message}`);
  return {claims: claimsData.claims, skills: (data ?? []) as CreatorSkill[]};
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
