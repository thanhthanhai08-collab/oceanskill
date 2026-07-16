import "server-only";
import {randomUUID} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {finalizeMcpUsage, releaseMcpUsage, reserveMcpUsage} from "@/lib/mcp/usage";
import type {AuthenticatedMcpKey} from "@/lib/mcp/authentication";

const metadataFields = "id,slug,title,description,category,current_version,compatible_clients,license_spdx,visibility,updated_at";
type CurrentSkillVersion = Readonly<{id: string; version: string; content_md: string; content_hash: string; scan_status: string}>;
export type McpToolName =
  | "list_purchased_skills"
  | "search_skills"
  | "get_skill_md"
  | "get_skill_reference"
  | "list_collections"
  | "add_collection_to_library"
  | "toggle_skill"
  | "get_usage_summary";

export async function recordMcpCall(auth: AuthenticatedMcpKey, toolName: McpToolName, requestId?: string) {
  const {error} = await createAdminClient().from("mcp_call_events").insert({
    user_id: auth.userId,
    api_key_id: auth.apiKeyId,
    tool_name: toolName,
    request_id: requestId ?? null,
  });
  if (error) throw new Error(`Could not record MCP call: ${error.message}`);
}

export async function listAvailableSkills(auth: AuthenticatedMcpKey) {
  const admin = createAdminClient();
  const [privateResult, libraryResult] = await Promise.all([
    admin.from("skills").select(metadataFields).eq("status", "active").eq("visibility", "private").eq("owner_id", auth.userId).limit(100),
    admin.from("user_skill_library").select(`enabled,skills!inner(${metadataFields})`).eq("user_id", auth.userId).eq("enabled", true).limit(100),
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

async function withReservedUsage<T>(
  input: {auth: AuthenticatedMcpKey; skillId: string; skillVersionId: string; toolName: "get_skill_md" | "get_skill_reference"; requestId: string; resourceKey?: string},
  operation: () => Promise<T>,
) {
  const reservation = await reserveMcpUsage(input);
  if (!reservation || reservation.result === "insufficient_credits") throw new Error("insufficient_credits");
  if (reservation.result === "version_conflict") throw new Error("version_conflict");
  if (reservation.result === "resource_conflict") throw new Error("request_id_conflict");
  let replayed = false;
  if (reservation.result === "duplicate") {
    const {data: existing, error} = await createAdminClient().from("usage_events")
      .select("user_id,api_key_id,skill_id,skill_version_id,tool_name,status,resource_key")
      .eq("request_id", input.requestId)
      .maybeSingle();
    if (error || !existing) throw new Error("usage_state_not_found");
    if (existing.user_id !== input.auth.userId || existing.api_key_id !== input.auth.apiKeyId || existing.skill_id !== input.skillId || existing.skill_version_id !== input.skillVersionId || existing.tool_name !== input.toolName || (existing.resource_key ?? null) !== (input.resourceKey ?? null)) throw new Error("request_id_conflict");
    if (existing.status !== "succeeded") throw new Error(existing.status === "reserved" ? "request_in_progress" : "request_previously_failed");
    replayed = true;
  } else if (reservation.result !== "reserved") throw new Error("usage_reservation_invalid");

  try {
    const value = await operation();
    if (!replayed) await finalizeMcpUsage(input.requestId);
    return {value, replayed, creditsCharged: replayed ? 0 : 1};
  } catch (error) {
    if (!replayed) await releaseMcpUsage(input.requestId, error instanceof Error ? error.message : "execution_failed").catch(() => undefined);
    throw error;
  }
}

async function loadAccessibleSkillVersion(auth: AuthenticatedMcpKey, skillId: string) {
  const admin = createAdminClient();
  const {data: skill, error} = await admin.from("skills").select(`${metadataFields},owner_id,skill_versions!skills_current_version_fkey(id,version,content_md,content_hash,scan_status)`)
    .eq("id", skillId).eq("status", "active").eq("skill_versions.scan_status", "passed").maybeSingle();
  if (error) throw new Error(`Could not load MCP skill: ${error.message}`);
  if (!skill || (skill.visibility === "private" && skill.owner_id !== auth.userId)) throw new Error("skill_not_available");
  if (skill.visibility === "public") {
    const {data: libraryEntry} = await admin.from("user_skill_library").select("id").eq("user_id", auth.userId).eq("skill_id", skillId).eq("enabled", true).maybeSingle();
    if (!libraryEntry) throw new Error("skill_not_in_user_library");
  }
  const relation = skill.skill_versions as unknown as CurrentSkillVersion | CurrentSkillVersion[] | null;
  const version = Array.isArray(relation) ? relation[0] : relation;
  if (!version || version.version !== skill.current_version) throw new Error("version_not_available");
  return {admin, skill, version};
}

export async function getSkillMd(auth: AuthenticatedMcpKey, skillId: string, requestId: string = randomUUID()) {
  const {admin, skill, version} = await loadAccessibleSkillVersion(auth, skillId);
  const usage = await withReservedUsage({auth, skillId, skillVersionId: version.id, toolName: "get_skill_md", requestId}, async () => {
    const {data, error} = await admin.from("skill_reference_files").select("reference_key,display_name,mime_type,size_bytes").eq("skill_version_id", version.id).order("reference_key").limit(100);
    if (error) throw new Error("reference_list_failed");
    return data ?? [];
  });
  return {skill: Object.fromEntries(Object.entries(skill).filter(([key]) => !["owner_id", "skill_versions"].includes(key))), version: version.version, content: version.content_md, contentHash: version.content_hash, references: usage.value, requestId, replayed: usage.replayed, creditsCharged: usage.creditsCharged};
}

export async function getSkillReference(auth: AuthenticatedMcpKey, skillId: string, referenceKey: string, requestId: string = randomUUID()) {
  const {admin, skill, version} = await loadAccessibleSkillVersion(auth, skillId);
  const usage = await withReservedUsage({auth, skillId, skillVersionId: version.id, toolName: "get_skill_reference", requestId, resourceKey: referenceKey}, async () => {
    const {data: reference, error} = await admin.from("skill_reference_files").select("reference_key,storage_bucket,storage_path,display_name,mime_type,size_bytes").eq("skill_version_id", version.id).eq("reference_key", referenceKey).maybeSingle();
    if (error || !reference) throw new Error("reference_not_available");
    if (Number(reference.size_bytes ?? 0) > 1_048_576) throw new Error("reference_too_large");
    const {data: blob, error: downloadError} = await admin.storage.from(reference.storage_bucket).download(reference.storage_path);
    if (downloadError || !blob) throw new Error("reference_download_failed");
    if (blob.size > 1_048_576) throw new Error("reference_too_large");
    const bytes = Buffer.from(await blob.arrayBuffer());
    const text = reference.mime_type.startsWith("text/") || ["application/json", "application/yaml", "application/xml", "application/javascript"].includes(reference.mime_type);
    return {reference, bytes, text, content: text ? bytes.toString("utf8") : bytes.toString("base64")};
  });
  const {reference, bytes, text, content} = usage.value;
  return {skill: {id: skill.id, slug: skill.slug, title: skill.title}, version: version.version, reference: {key: reference.reference_key, name: reference.display_name, mimeType: reference.mime_type, sizeBytes: bytes.length}, encoding: text ? "utf-8" : "base64", content, requestId, replayed: usage.replayed, creditsCharged: usage.creditsCharged};
}

export async function listCollections(auth: AuthenticatedMcpKey) {
  const admin = createAdminClient();
  const {data, error} = await admin
    .from("skill_collections")
    .select("id,name,description,visibility,accent,updated_at,user_id,skill_collection_items(skill_id,position,skills!inner(id,slug,title,description,category,current_version,compatible_clients,license_spdx,visibility,updated_at))")
    .or(`visibility.eq.public,user_id.eq.${auth.userId}`)
    .order("updated_at", {ascending: false})
    .limit(100);
  if (error) throw new Error(`Could not list collections: ${error.message}`);
  return (data ?? []).map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    owned: collection.user_id === auth.userId,
    accent: collection.accent,
    updated_at: collection.updated_at,
    skills: [...(collection.skill_collection_items ?? [])]
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((item) => Array.isArray(item.skills) ? item.skills[0] : item.skills),
  }));
}

export async function addCollectionToLibrary(auth: AuthenticatedMcpKey, collectionId: string) {
  const admin = createAdminClient();
  const {data: collection, error} = await admin
    .from("skill_collections")
    .select("id,user_id,visibility,skill_collection_items(skill_id,position)")
    .eq("id", collectionId)
    .maybeSingle();
  if (error) throw new Error(`Could not load collection: ${error.message}`);
  if (!collection || (collection.visibility !== "public" && collection.user_id !== auth.userId)) throw new Error("collection_not_available");

  await admin.from("user_collection_library").upsert({user_id: auth.userId, collection_id: collectionId}, {onConflict: "user_id,collection_id"});
  const skillIds = (collection.skill_collection_items ?? []).map((item) => item.skill_id).filter(Boolean);
  if (skillIds.length) {
    const {error: upsertError} = await admin.from("user_skill_library").upsert(
      skillIds.map((skillId) => ({user_id: auth.userId, skill_id: skillId, enabled: true})),
      {onConflict: "user_id,skill_id"},
    );
    if (upsertError) throw new Error(`Could not add collection skills: ${upsertError.message}`);
  }
  return {collectionId, addedSkills: skillIds.length, enabled: true};
}

export async function toggleSkill(auth: AuthenticatedMcpKey, skillId: string, enabled: boolean) {
  const admin = createAdminClient();
  const {data: skill, error} = await admin.from("skills").select("id,visibility,owner_id,status").eq("id", skillId).eq("status", "active").maybeSingle();
  if (error) throw new Error(`Could not load skill: ${error.message}`);
  if (!skill || (skill.visibility === "private" && skill.owner_id !== auth.userId)) throw new Error("skill_not_available");

  const {data, error: upsertError} = await admin.from("user_skill_library").upsert(
    {user_id: auth.userId, skill_id: skillId, enabled},
    {onConflict: "user_id,skill_id"},
  ).select("skill_id,enabled,added_at").single();
  if (upsertError) throw new Error(`Could not toggle skill: ${upsertError.message}`);
  return data;
}

export async function getUsageSummary(auth: AuthenticatedMcpKey) {
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [balanceResult, usageResult, callResult, enabledResult] = await Promise.all([
    admin.from("user_credit_balances").select("available_units").eq("user_id", auth.userId).maybeSingle(),
    admin.from("usage_events").select("id,units,status,tool_name,created_at").eq("user_id", auth.userId).gte("created_at", monthStart.toISOString()).order("created_at", {ascending: false}).limit(1000),
    admin.from("mcp_call_events").select("id,tool_name,created_at").eq("user_id", auth.userId).gte("created_at", monthStart.toISOString()).order("created_at", {ascending: false}).limit(1000),
    admin.from("user_skill_library").select("id", {count: "exact", head: true}).eq("user_id", auth.userId).eq("enabled", true),
  ]);
  if (balanceResult.error || usageResult.error || callResult.error || enabledResult.error) throw new Error(`Could not load usage summary: ${(balanceResult.error ?? usageResult.error ?? callResult.error ?? enabledResult.error)?.message}`);
  const paidEvents = usageResult.data ?? [];
  const calls = callResult.data ?? [];
  const succeeded = paidEvents.filter((event) => event.status === "succeeded");
  const spentUnits = succeeded.reduce((sum, event) => sum + Number(event.units ?? 0), 0);
  return {
    availableCredits: Number(balanceResult.data?.available_units ?? 0),
    monthStart: monthStart.toISOString(),
    monthlyMcpCalls: calls.length,
    monthlyPaidCalls: succeeded.length,
    monthlySpentCredits: spentUnits,
    enabledSkills: enabledResult.count ?? 0,
    recentMcpCalls: calls.slice(0, 10),
    recentPaidUsage: paidEvents.slice(0, 10),
  };
}
