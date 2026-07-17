import "server-only";
import {createHash, randomUUID} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {finalizeMcpUsage, releaseMcpUsage, reserveMcpUsage} from "@/lib/mcp/usage";
import type {AuthenticatedMcpKey} from "@/lib/mcp/authentication";

const metadataFields = "id,slug,title,description,category,current_version,compatible_clients,license_spdx,visibility,updated_at";
type CurrentSkillVersion = Readonly<{id: string; version: string; scan_status: string; skill_md_bucket: string; skill_md_path: string | null; skill_md_size_bytes: number | null; skill_md_hash: string | null; skill_md_verified_at: string | null}>;
const requestReplayWindowMs = 10 * 60 * 1000;
const maxSkillMdBytes = 1_048_576;
export type McpToolName =
  | "list_purchased_skills"
  | "search_skills"
  | "get_skill_md"
  | "get_skill_reference"
  | "list_collections"
  | "add_collection_to_library"
  | "create_skill_collection"
  | "update_skill_collection"
  | "delete_skill_collection"
  | "execute_skill_collection"
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
      .select("user_id,api_key_id,skill_id,skill_version_id,tool_name,status,resource_key,created_at")
      .eq("request_id", input.requestId)
      .maybeSingle();
    if (error || !existing) throw new Error("usage_state_not_found");
    if (existing.user_id !== input.auth.userId || existing.api_key_id !== input.auth.apiKeyId || existing.skill_id !== input.skillId || existing.skill_version_id !== input.skillVersionId || existing.tool_name !== input.toolName || (existing.resource_key ?? null) !== (input.resourceKey ?? null)) throw new Error("request_id_conflict");
    const createdAt = Date.parse(existing.created_at);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > requestReplayWindowMs) {
      if (existing.status === "reserved") await releaseMcpUsage(input.requestId, "REQUEST_ID_EXPIRED").catch(() => undefined);
      throw new Error("request_id_expired");
    }
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
  const {data: skill, error} = await admin.from("skills").select(`${metadataFields},owner_id,skill_versions!skills_current_version_fkey(id,version,scan_status,skill_md_bucket,skill_md_path,skill_md_size_bytes,skill_md_hash,skill_md_verified_at)`)
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
    if (!version.skill_md_path) throw new Error("skill_md_not_available");
    if (!version.skill_md_hash || !version.skill_md_verified_at) throw new Error("skill_md_not_verified");
    if (Number(version.skill_md_size_bytes ?? 0) > maxSkillMdBytes) throw new Error("skill_md_too_large");
    const {data: blob, error: downloadError} = await admin.storage.from(version.skill_md_bucket).download(version.skill_md_path, {}, {cache: "no-store"});
    if (downloadError || !blob) throw new Error("skill_md_download_failed");
    if (blob.size > maxSkillMdBytes) throw new Error("skill_md_too_large");
    const bytes = Buffer.from(await blob.arrayBuffer());
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    if (contentHash !== version.skill_md_hash) throw new Error("skill_md_hash_mismatch");
    let content: string;
    try {
      content = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
    } catch {
      throw new Error("skill_md_invalid_utf8");
    }
    const {data, error} = await admin.from("skill_reference_files").select("reference_key,display_name,mime_type,size_bytes").eq("skill_version_id", version.id).order("reference_key").limit(100);
    if (error) throw new Error("reference_list_failed");
    return {content, contentHash, sizeBytes: bytes.length, references: (data ?? []).filter((reference) => !isReservedSkillMdReference(reference.reference_key))};
  });
  return {skill: Object.fromEntries(Object.entries(skill).filter(([key]) => !["owner_id", "skill_versions"].includes(key))), version: version.version, content: usage.value.content, contentHash: usage.value.contentHash, sizeBytes: usage.value.sizeBytes, references: usage.value.references, requestId, replayed: usage.replayed, creditsCharged: usage.creditsCharged};
}

function isReservedSkillMdReference(value: string) {
  return /(^|\/)skill\.md$/i.test(value.trim().replaceAll("\\", "/"));
}

export async function getSkillReference(auth: AuthenticatedMcpKey, skillId: string, referenceKey: string, requestId: string = randomUUID()) {
  if (isReservedSkillMdReference(referenceKey)) throw new Error("reference_key_reserved");
  const {admin, skill, version} = await loadAccessibleSkillVersion(auth, skillId);
  const usage = await withReservedUsage({auth, skillId, skillVersionId: version.id, toolName: "get_skill_reference", requestId, resourceKey: referenceKey}, async () => {
    const {data: reference, error} = await admin.from("skill_reference_files").select("reference_key,storage_bucket,storage_path,display_name,mime_type,size_bytes,content_hash,verified_at").eq("skill_version_id", version.id).eq("reference_key", referenceKey).maybeSingle();
    if (error || !reference) throw new Error("reference_not_available");
    if (isReservedSkillMdReference(reference.reference_key) || isReservedSkillMdReference(reference.storage_path)) throw new Error("reference_key_reserved");
    if (!reference.content_hash || !reference.verified_at) throw new Error("reference_not_verified");
    if (Number(reference.size_bytes ?? 0) > 1_048_576) throw new Error("reference_too_large");
    const {data: blob, error: downloadError} = await admin.storage.from(reference.storage_bucket).download(reference.storage_path);
    if (downloadError || !blob) throw new Error("reference_download_failed");
    if (blob.size > 1_048_576) throw new Error("reference_too_large");
    const bytes = Buffer.from(await blob.arrayBuffer());
    const referenceHash = createHash("sha256").update(bytes).digest("hex");
    if (referenceHash !== reference.content_hash) throw new Error("reference_hash_mismatch");
    const text = reference.mime_type.startsWith("text/") || ["application/json", "application/yaml", "application/xml", "application/javascript"].includes(reference.mime_type);
    return {reference, referenceHash, bytes, text, content: text ? bytes.toString("utf8") : bytes.toString("base64")};
  });
  const {reference, referenceHash, bytes, text, content} = usage.value;
  return {skill: {id: skill.id, slug: skill.slug, title: skill.title}, version: version.version, reference: {key: reference.reference_key, name: reference.display_name, mimeType: reference.mime_type, sizeBytes: bytes.length, contentHash: referenceHash}, encoding: text ? "utf-8" : "base64", content, requestId, replayed: usage.replayed, creditsCharged: usage.creditsCharged};
}

export async function listCollections(auth: AuthenticatedMcpKey) {
  const admin = createAdminClient();
  const {data, error} = await admin
    .from("skill_collections")
    .select("id,slug,name,description,visibility,collection_type,accent,updated_at,user_id,skill_collection_items(skill_id,position,skills!inner(id,slug,title,description,category,current_version,compatible_clients,license_spdx,visibility,updated_at))")
    .or(`collection_type.eq.platform,and(collection_type.eq.user,user_id.eq.${auth.userId})`)
    .order("updated_at", {ascending: false})
    .limit(100);
  if (error) throw new Error(`Could not list collections: ${error.message}`);
  return (data ?? []).map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    owned: collection.user_id === auth.userId,
    collectionType: collection.collection_type,
    permissions: collection.collection_type === "platform"
      ? {canView: true, canAddToLibrary: true, canEdit: false, canDelete: false, canExecute: false}
      : {canView: true, canAddToLibrary: true, canEdit: true, canDelete: true, canExecute: true},
    accent: collection.accent,
    updated_at: collection.updated_at,
    skills: [...(collection.skill_collection_items ?? [])]
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((item) => Array.isArray(item.skills) ? item.skills[0] : item.skills),
  }));
}

export async function addCollectionToLibrary(auth: AuthenticatedMcpKey, collectionId: string) {
  const admin = createAdminClient();
  const {data, error} = await admin.rpc("mcp_add_skill_collection_to_library", {p_user_id: auth.userId, p_collection_id: collectionId});
  if (error) throw new Error(`Could not add collection: ${error.message}`);
  if (data !== true) throw new Error("collection_not_available");
  return {collectionId, added: true, enabled: true};
}

type CollectionInput = Readonly<{name: string; slug: string; description?: string; accent?: string; skillIds: string[]}>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanCollectionInput(input: CollectionInput) {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = (input.description ?? "").trim();
  const accent = input.accent ?? "primary";
  const skillIds = [...new Set(input.skillIds)];
  if (!name || name.length > 120) throw new Error("invalid_collection_name");
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 80) throw new Error("invalid_collection_slug");
  if (description.length > 500) throw new Error("invalid_collection_description");
  if (!["primary", "secondary", "tertiary"].includes(accent)) throw new Error("invalid_collection_accent");
  if (!skillIds.length || skillIds.length > 100 || skillIds.some((id) => !uuidPattern.test(id))) throw new Error("invalid_collection_skills");
  return {name, slug, description, accent, skillIds};
}

export async function createSkillCollection(auth: AuthenticatedMcpKey, input: CollectionInput) {
  const value = cleanCollectionInput(input);
  const {data, error} = await createAdminClient().rpc("mcp_create_skill_collection", {
    p_user_id: auth.userId, p_name: value.name, p_slug: value.slug, p_description: value.description,
    p_accent: value.accent, p_skill_ids: value.skillIds,
  });
  if (error) throw new Error(error.code === "23505" ? "collection_duplicate" : error.message);
  return {collectionId: data, created: true};
}

export async function updateSkillCollection(auth: AuthenticatedMcpKey, collectionId: string, input: CollectionInput) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  const value = cleanCollectionInput(input);
  const {data, error} = await createAdminClient().rpc("mcp_replace_skill_collection", {
    p_user_id: auth.userId, p_collection_id: collectionId, p_name: value.name, p_slug: value.slug,
    p_description: value.description, p_skill_ids: value.skillIds,
  });
  if (error) throw new Error(error.code === "23505" ? "collection_duplicate" : error.message);
  if (data !== true) throw new Error("collection_not_editable");
  return {collectionId, updated: true};
}

export async function deleteSkillCollection(auth: AuthenticatedMcpKey, collectionId: string) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  const {data, error} = await createAdminClient().rpc("mcp_delete_skill_collection", {p_user_id: auth.userId, p_collection_id: collectionId});
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("collection_not_deletable");
  return {collectionId, deleted: true};
}

export async function executeSkillCollection(auth: AuthenticatedMcpKey, collectionId: string, requestId: string = randomUUID()) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  if (!requestId.trim() || requestId.length > 120) throw new Error("invalid_request_id");
  const admin = createAdminClient();
  const [{data: collection, error: collectionError}, {data: libraryEntry, error: libraryError}] = await Promise.all([
    admin.from("skill_collections").select("id,slug,name,user_id,collection_type,skill_collection_items(skill_id,position)").eq("id", collectionId).maybeSingle(),
    admin.from("user_collection_library").select("collection_id").eq("user_id", auth.userId).eq("collection_id", collectionId).maybeSingle(),
  ]);
  if (collectionError || libraryError) throw new Error(`Could not load collection: ${(collectionError ?? libraryError)?.message}`);
  if (!collection || !libraryEntry) throw new Error("collection_not_available");
  if (collection.collection_type !== "user" || collection.user_id !== auth.userId) throw new Error("collection_not_executable");
  const items = [...(collection.skill_collection_items ?? [])].sort((a, b) => Number(a.position) - Number(b.position));
  if (!items.length) throw new Error("collection_empty");
  if (items.length > 10) throw new Error("collection_execution_limit");

  const completed: unknown[] = [];
  for (const item of items) {
    const childRequestId = `collection:${createHash("sha256").update(`${requestId}:${collectionId}:${item.position}:${item.skill_id}`).digest("hex")}`;
    try {
      completed.push(await getSkillMd(auth, item.skill_id, childRequestId));
    } catch (error) {
      return {
        status: "stopped", collectionId, requestId, completed,
        failed: {position: item.position, skillId: item.skill_id, error: error instanceof Error ? error.message : "skill_execution_failed"},
        creditsCharged: completed.reduce<number>((sum, value) => sum + Number((value as {creditsCharged?: number}).creditsCharged ?? 0), 0),
      };
    }
  }
  return {status: "completed", collectionId, requestId, completed, creditsCharged: completed.reduce<number>((sum, value) => sum + Number((value as {creditsCharged?: number}).creditsCharged ?? 0), 0)};
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
