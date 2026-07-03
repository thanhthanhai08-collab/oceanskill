import "server-only";
import {randomUUID} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {finalizeMcpUsage, releaseMcpUsage, reserveMcpUsage} from "@/lib/mcp/usage";
import type {AuthenticatedMcpKey} from "@/lib/mcp/authentication";

const metadataFields = "id,slug,title,description,domain,current_version,compatible_clients,license_spdx,visibility,updated_at";

export async function listAvailableSkills(auth: AuthenticatedMcpKey) {
  const admin = createAdminClient();
  const [privateResult, libraryResult] = await Promise.all([
    admin.from("skills").select(metadataFields).eq("status", "active").eq("visibility", "private").eq("owner_id", auth.userId).limit(100),
    admin.from("user_skill_library").select(`skills!inner(${metadataFields})`).eq("user_id", auth.userId).limit(100),
  ]);
  if (privateResult.error || libraryResult.error) throw new Error(`Could not list MCP skills: ${(privateResult.error ?? libraryResult.error)?.message}`);
  const platform = (libraryResult.data ?? []).flatMap((row) => Array.isArray(row.skills) ? row.skills : [row.skills]);
  return [...(privateResult.data ?? []), ...platform].sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

export async function searchAvailableSkills(auth: AuthenticatedMcpKey, query: string) {
  const safeQuery = query.trim().replace(/[%_,()]/g, " ").slice(0, 80);
  if (!safeQuery) return [];
  const {data, error} = await createAdminClient().from("skills").select(metadataFields)
    .eq("status", "active").or(`visibility.eq.public,and(visibility.eq.private,owner_id.eq.${auth.userId})`)
    .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`).limit(25);
  if (error) throw new Error(`Could not search MCP skills: ${error.message}`);
  return data ?? [];
}

export async function getSkillContent(auth: AuthenticatedMcpKey, skillId: string, requestId: string = randomUUID()) {
  const admin = createAdminClient();
  const {data: skill, error} = await admin.from("skills").select(`${metadataFields},owner_id,skill_versions!inner(id,version,content_md,content_hash,scan_status)`)
    .eq("id", skillId).eq("status", "active").eq("skill_versions.scan_status", "passed").maybeSingle();
  if (error) throw new Error(`Could not load MCP skill: ${error.message}`);
  if (!skill || (skill.visibility === "private" && skill.owner_id !== auth.userId)) throw new Error("skill_not_available");
  if (skill.visibility === "public") {
    const {data: libraryEntry} = await admin.from("user_skill_library").select("id").eq("user_id", auth.userId).eq("skill_id", skillId).maybeSingle();
    if (!libraryEntry) throw new Error("skill_not_in_user_library");
  }
  const reservation = await reserveMcpUsage({userId: auth.userId, apiKeyId: auth.apiKeyId, skillId, toolName: "get_skill_content", requestId});
  if (!reservation || reservation.result === "insufficient_credits") throw new Error("insufficient_credits");
  try {
    const version = Array.isArray(skill.skill_versions) ? skill.skill_versions.find((item) => item.version === skill.current_version) : null;
    if (!version) throw new Error("version_not_available");
    await finalizeMcpUsage(requestId);
    return {skill: Object.fromEntries(Object.entries(skill).filter(([key]) => !["owner_id", "skill_versions"].includes(key))), version: version.version, content: version.content_md, contentHash: version.content_hash};
  } catch (error) {
    await releaseMcpUsage(requestId, error instanceof Error ? error.message : "execution_failed");
    throw error;
  }
}
