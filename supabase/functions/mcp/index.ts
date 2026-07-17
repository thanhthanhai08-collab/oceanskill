import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {hasReplayScopeConflict} from "./replay.ts";

type RpcRequest = Readonly<{
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}>;

type AuthenticatedMcpKey = Readonly<{apiKeyId: string; userId: string}>;
type McpErrorData = Readonly<{
  errorCode: string;
  retryable: boolean;
  requestId?: string;
  previousErrorCode?: string | null;
}>;

class McpToolError extends Error {
  constructor(
    readonly errorCode: string,
    message: string,
    readonly status: number,
    readonly retryable = false,
    readonly requestId?: string,
    readonly previousErrorCode?: string | null,
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {autoRefreshToken: false, persistSession: false},
});

const metadataFields = "id,slug,title,description,category,domain,current_version,compatible_clients,license_spdx,visibility,updated_at";
const windows = new Map<string, {count: number; resetAt: number}>();
const requestReplayWindowMs = 10 * 60 * 1000;
const maxSkillMdBytes = 1_048_576;
type McpToolName =
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

function rpc(id: RpcRequest["id"], result: unknown, status = 200) {
  return Response.json({jsonrpc: "2.0", id: id ?? null, result}, {status, headers: {"Cache-Control": "no-store"}});
}

function rpcError(id: RpcRequest["id"], code: number, message: string, status = 400, data?: McpErrorData) {
  return Response.json({jsonrpc: "2.0", id: id ?? null, error: {code, message, ...(data ? {data} : {})}}, {status, headers: {"Cache-Control": "no-store"}});
}

function limited(key: string) {
  const now = Date.now();
  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, {count: 1, resetAt: now + 60_000});
    return false;
  }
  existing.count += 1;
  return existing.count > 60;
}

async function sha256BytesHex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  return sha256BytesHex(new TextEncoder().encode(value));
}

async function authenticateMcpRequest(request: Request): Promise<AuthenticatedMcpKey | null> {
  const authorization = request.headers.get("authorization") ?? "";
  const rawKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!/^nsk_[A-Za-z0-9_-]{40,}$/.test(rawKey)) return null;
  const keyHash = await sha256Hex(rawKey);
  const {data, error} = await admin.rpc("resolve_mcp_api_key", {p_key_hash: keyHash});
  if (error) throw new Error(`mcp_auth_failed:${error.message}`);
  const match = Array.isArray(data) ? data[0] : data;
  if (!match?.api_key_id || !match?.user_id) return null;
  await admin.from("api_keys").update({last_used_at: new Date().toISOString()}).eq("id", match.api_key_id);
  return {apiKeyId: String(match.api_key_id), userId: String(match.user_id)};
}

async function recordMcpCall(auth: AuthenticatedMcpKey, toolName: McpToolName, requestId?: string) {
  const {error} = await admin.from("mcp_call_events").insert({
    user_id: auth.userId,
    api_key_id: auth.apiKeyId,
    tool_name: toolName,
    request_id: requestId ?? null,
  });
  if (error) throw new Error(error.message);
}

async function listAvailableSkills(auth: AuthenticatedMcpKey) {
  const [privateResult, libraryResult] = await Promise.all([
    admin.from("skills").select(metadataFields).eq("status", "active").eq("visibility", "private").eq("owner_id", auth.userId).limit(100),
    admin.from("user_skill_library").select(`enabled,skills!inner(${metadataFields})`).eq("user_id", auth.userId).eq("enabled", true).limit(100),
  ]);
  if (privateResult.error || libraryResult.error) throw new Error((privateResult.error ?? libraryResult.error)?.message ?? "list_failed");
  const platform = (libraryResult.data ?? []).flatMap((row) => Array.isArray(row.skills) ? row.skills : [row.skills]);
  return [...(privateResult.data ?? []), ...platform].sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

async function searchAvailableSkills(auth: AuthenticatedMcpKey, query: string) {
  const safeQuery = query.trim().replace(/[%_,()]/g, " ").slice(0, 80);
  if (!safeQuery) return [];
  const {data, error} = await admin.from("skills").select(metadataFields)
    .eq("status", "active")
    .or(`visibility.eq.public,and(visibility.eq.private,owner_id.eq.${auth.userId})`)
    .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
    .limit(25);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function reserveMcpUsage(input: {auth: AuthenticatedMcpKey; skillId: string; skillVersionId: string; toolName: "get_skill_md" | "get_skill_reference"; requestId: string; resourceKey?: string}) {
  const {data, error} = await admin.rpc("reserve_mcp_usage_resource_versioned", {
    p_user_id: input.auth.userId,
    p_api_key_id: input.auth.apiKeyId,
    p_skill_id: input.skillId,
    p_skill_version_id: input.skillVersionId,
    p_tool_name: input.toolName,
    p_request_id: input.requestId,
    p_resource_key: input.resourceKey ?? null,
    p_units: 1,
  });
  if (error) throw new McpToolError("USAGE_RESERVATION_FAILED", "Unable to reserve credit for this request.", 503, true, input.requestId);
  return Array.isArray(data) ? data[0] : data;
}

async function finalizeMcpUsage(requestId: string) {
  const {data, error} = await admin.rpc("finalize_mcp_usage", {p_request_id: requestId});
  if (error) throw new Error(error.message);
  return data === true;
}

async function releaseMcpUsage(requestId: string, errorCode: string) {
  const {data, error} = await admin.rpc("release_mcp_usage", {p_request_id: requestId, p_error_code: errorCode});
  if (error) throw new Error(error.message);
  return data === true;
}

async function getUsageEvent(auth: AuthenticatedMcpKey, requestId: string) {
  const {data, error} = await admin.from("usage_events")
    .select("skill_id,skill_version_id,tool_name,status,error_code,resource_key,created_at")
    .eq("user_id", auth.userId)
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function withReservedUsage<T>(
  input: {auth: AuthenticatedMcpKey; skillId: string; skillVersionId: string; toolName: "get_skill_md" | "get_skill_reference"; requestId: string; resourceKey?: string},
  operation: () => Promise<T>,
) {
  const reservation = await reserveMcpUsage(input);
  if (!reservation) throw new McpToolError("USAGE_RESERVATION_FAILED", "Unable to reserve credit for this request.", 503, true, input.requestId);
  if (reservation.result === "insufficient_credits") throw new McpToolError("INSUFFICIENT_CREDITS", "No credits remain for this paid MCP tool call.", 402, false, input.requestId);
  if (reservation.result === "version_conflict") throw new McpToolError("VERSION_CHANGED", "The current skill version changed while this request was starting. Retry with a new requestId.", 409, true, input.requestId);
  if (reservation.result === "resource_conflict") throw new McpToolError("REQUEST_ID_CONFLICT", "This requestId was already used for another reference. Use a new requestId.", 409, false, input.requestId);

  let replayed = false;
  if (reservation.result === "duplicate") {
    const existing = await getUsageEvent(input.auth, input.requestId);
    if (!existing) throw new McpToolError("USAGE_STATE_NOT_FOUND", "The existing request could not be verified.", 503, true, input.requestId);
    if (hasReplayScopeConflict(existing, {skillId: input.skillId, skillVersionId: input.skillVersionId, toolName: input.toolName, resourceKey: input.resourceKey})) {
      throw new McpToolError("REQUEST_ID_CONFLICT", "This requestId was already used for another tool, skill, version, or reference. Use a new requestId.", 409, false, input.requestId);
    }
    const createdAt = Date.parse(existing.created_at);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > requestReplayWindowMs) {
      if (existing.status === "reserved") await releaseMcpUsage(input.requestId, "REQUEST_ID_EXPIRED").catch(() => undefined);
      throw new McpToolError("REQUEST_ID_EXPIRED", "This requestId's 10-minute replay window has expired. Use a new requestId.", 409, false, input.requestId);
    }
    if (existing.status === "reserved") throw new McpToolError("REQUEST_IN_PROGRESS", "A request with this requestId is still being processed. Retry later with the same requestId.", 409, true, input.requestId);
    if (existing.status === "failed") throw new McpToolError("REQUEST_PREVIOUSLY_FAILED", "A previous request with this requestId failed. Use a new requestId.", 409, true, input.requestId, existing.error_code);
    if (existing.status !== "succeeded") throw new McpToolError("USAGE_STATE_INVALID", "The existing request has an unsupported usage state.", 500, false, input.requestId);
    replayed = true;
  } else if (reservation.result !== "reserved") {
    throw new McpToolError("USAGE_RESERVATION_INVALID", "The credit reservation returned an unsupported result.", 500, false, input.requestId);
  }

  try {
    const value = await operation();
    if (!replayed && !(await finalizeMcpUsage(input.requestId))) throw new McpToolError("USAGE_FINALIZATION_FAILED", "The request completed, but its credit usage could not be finalized.", 503, true, input.requestId);
    return {value, replayed, creditsCharged: replayed ? 0 : 1};
  } catch (error) {
    if (!replayed) await releaseMcpUsage(input.requestId, error instanceof McpToolError ? error.errorCode : "EXECUTION_FAILED").catch((releaseError) => console.error("mcp_usage_release_failed", {requestId: input.requestId, releaseError}));
    throw error;
  }
}

async function loadAccessibleSkillVersion(auth: AuthenticatedMcpKey, skillId: string) {
  const {data: skill, error} = await admin.from("skills")
    .select(`${metadataFields},owner_id,skill_versions!skills_current_version_fkey(id,version,scan_status,skill_md_bucket,skill_md_path,skill_md_size_bytes,skill_md_hash,skill_md_verified_at)`)
    .eq("id", skillId)
    .eq("status", "active")
    .eq("skill_versions.scan_status", "passed")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!skill || (skill.visibility === "private" && skill.owner_id !== auth.userId)) throw new Error("skill_not_available");
  if (skill.visibility === "public") {
    const {data: libraryEntry} = await admin.from("user_skill_library").select("id").eq("user_id", auth.userId).eq("skill_id", skillId).eq("enabled", true).maybeSingle();
    if (!libraryEntry) throw new Error("skill_not_in_user_library");
  }

  const version = skill.skill_versions;
  if (!version || Array.isArray(version) || version.version !== skill.current_version) throw new Error("version_not_available");
  return {skill, version};
}

async function listSkillReferences(skillVersionId: string) {
  const {data, error} = await admin.from("skill_reference_files")
    .select("reference_key,display_name,mime_type,size_bytes")
    .eq("skill_version_id", skillVersionId)
    .order("reference_key")
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((reference) => !isReservedSkillMdReference(reference.reference_key));
}

async function getSkillMd(auth: AuthenticatedMcpKey, skillId: string, suppliedRequestId?: string) {
  const requestId = suppliedRequestId ?? crypto.randomUUID();
  const {skill, version} = await loadAccessibleSkillVersion(auth, skillId);
  const usage = await withReservedUsage(
    {auth, skillId, skillVersionId: version.id, toolName: "get_skill_md", requestId},
    async () => {
      if (!version.skill_md_path) throw new Error("skill_md_not_available");
      if (!version.skill_md_hash || !version.skill_md_verified_at) throw new Error("skill_md_not_verified");
      if (Number(version.skill_md_size_bytes ?? 0) > maxSkillMdBytes) throw new Error("skill_md_too_large");
      const {data: blob, error: downloadError} = await admin.storage
        .from(version.skill_md_bucket)
        .download(version.skill_md_path, {}, {cache: "no-store"});
      if (downloadError || !blob) throw new Error("skill_md_download_failed");
      if (blob.size > maxSkillMdBytes) throw new Error("skill_md_too_large");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const contentHash = await sha256BytesHex(bytes);
      if (contentHash !== version.skill_md_hash) throw new Error("skill_md_hash_mismatch");
      let content: string;
      try {
        content = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
      } catch {
        throw new Error("skill_md_invalid_utf8");
      }
      return {content, contentHash, sizeBytes: bytes.length, references: await listSkillReferences(version.id)};
    },
  );
  const publicSkill = {...skill};
  delete publicSkill.owner_id;
  delete publicSkill.skill_versions;
  return {skill: publicSkill, version: version.version, content: usage.value.content, contentHash: usage.value.contentHash, sizeBytes: usage.value.sizeBytes, references: usage.value.references, requestId, replayed: usage.replayed, creditsCharged: usage.creditsCharged};
}

function isTextMimeType(mimeType: string) {
  return mimeType.startsWith("text/") || ["application/json", "application/yaml", "application/xml", "application/javascript"].includes(mimeType);
}

function isReservedSkillMdReference(value: string) {
  return /(^|\/)skill\.md$/i.test(value.trim().replaceAll("\\", "/"));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

async function getSkillReference(auth: AuthenticatedMcpKey, skillId: string, referenceKey: string, suppliedRequestId?: string) {
  const requestId = suppliedRequestId ?? crypto.randomUUID();
  if (isReservedSkillMdReference(referenceKey)) throw new Error("reference_key_reserved");
  const {skill, version} = await loadAccessibleSkillVersion(auth, skillId);
  const usage = await withReservedUsage(
    {auth, skillId, skillVersionId: version.id, toolName: "get_skill_reference", requestId, resourceKey: referenceKey},
    async () => {
      const {data: reference, error: referenceError} = await admin.from("skill_reference_files")
        .select("reference_key,storage_bucket,storage_path,display_name,mime_type,size_bytes,content_hash,verified_at")
        .eq("skill_version_id", version.id)
        .eq("reference_key", referenceKey)
        .maybeSingle();
      if (referenceError) throw new Error(referenceError.message);
      if (!reference) throw new Error("reference_not_available");
      if (isReservedSkillMdReference(reference.reference_key) || isReservedSkillMdReference(reference.storage_path)) throw new Error("reference_key_reserved");
      if (!reference.content_hash || !reference.verified_at) throw new Error("reference_not_verified");
      if (Number(reference.size_bytes ?? 0) > 1_048_576) throw new Error("reference_too_large");
      const {data: blob, error: downloadError} = await admin.storage.from(reference.storage_bucket).download(reference.storage_path);
      if (downloadError || !blob) throw new Error("reference_download_failed");
      if (blob.size > 1_048_576) throw new Error("reference_too_large");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const referenceHash = await sha256BytesHex(bytes);
      if (referenceHash !== reference.content_hash) throw new Error("reference_hash_mismatch");
      const text = isTextMimeType(reference.mime_type);
      return {reference, referenceHash, bytes, text, content: text ? new TextDecoder().decode(bytes) : bytesToBase64(bytes)};
    },
  );
  const {reference, referenceHash, bytes, text, content} = usage.value;
  return {
    skill: {id: skill.id, slug: skill.slug, title: skill.title},
    version: version.version,
    reference: {key: reference.reference_key, name: reference.display_name, mimeType: reference.mime_type, sizeBytes: bytes.length, contentHash: referenceHash},
    encoding: text ? "utf-8" : "base64",
    content,
    requestId,
    replayed: usage.replayed,
    creditsCharged: usage.creditsCharged,
  };
}

async function listCollections(auth: AuthenticatedMcpKey) {
  const {data, error} = await admin
    .from("skill_collections")
    .select("id,slug,name,description,visibility,collection_type,accent,updated_at,user_id,skill_collection_items(skill_id,position,skills!inner(id,slug,title,description,category,domain,current_version,compatible_clients,license_spdx,visibility,updated_at))")
    .or(`collection_type.eq.platform,and(collection_type.eq.user,user_id.eq.${auth.userId})`)
    .order("updated_at", {ascending: false})
    .limit(100);
  if (error) throw new Error(error.message);
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

async function addCollectionToLibrary(auth: AuthenticatedMcpKey, collectionId: string) {
  const {data, error} = await admin.rpc("mcp_add_skill_collection_to_library", {p_user_id: auth.userId, p_collection_id: collectionId});
  if (error) throw new Error(error.message);
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

async function createSkillCollection(auth: AuthenticatedMcpKey, input: CollectionInput) {
  const value = cleanCollectionInput(input);
  const {data, error} = await admin.rpc("mcp_create_skill_collection", {p_user_id: auth.userId, p_name: value.name, p_slug: value.slug, p_description: value.description, p_accent: value.accent, p_skill_ids: value.skillIds});
  if (error) throw new Error(error.code === "23505" ? "collection_duplicate" : error.message);
  return {collectionId: data, created: true};
}

async function updateSkillCollection(auth: AuthenticatedMcpKey, collectionId: string, input: CollectionInput) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  const value = cleanCollectionInput(input);
  const {data, error} = await admin.rpc("mcp_replace_skill_collection", {p_user_id: auth.userId, p_collection_id: collectionId, p_name: value.name, p_slug: value.slug, p_description: value.description, p_skill_ids: value.skillIds});
  if (error) throw new Error(error.code === "23505" ? "collection_duplicate" : error.message);
  if (data !== true) throw new Error("collection_not_editable");
  return {collectionId, updated: true};
}

async function deleteSkillCollection(auth: AuthenticatedMcpKey, collectionId: string) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  const {data, error} = await admin.rpc("mcp_delete_skill_collection", {p_user_id: auth.userId, p_collection_id: collectionId});
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("collection_not_deletable");
  return {collectionId, deleted: true};
}

async function executeSkillCollection(auth: AuthenticatedMcpKey, collectionId: string, requestId = crypto.randomUUID()) {
  if (!uuidPattern.test(collectionId)) throw new Error("invalid_collection_id");
  const [{data: collection, error: collectionError}, {data: libraryEntry, error: libraryError}] = await Promise.all([
    admin.from("skill_collections").select("id,user_id,collection_type,skill_collection_items(skill_id,position)").eq("id", collectionId).maybeSingle(),
    admin.from("user_collection_library").select("collection_id").eq("user_id", auth.userId).eq("collection_id", collectionId).maybeSingle(),
  ]);
  if (collectionError || libraryError) throw new Error((collectionError ?? libraryError)?.message ?? "collection_load_failed");
  if (!collection || !libraryEntry) throw new Error("collection_not_available");
  if (collection.collection_type !== "user" || collection.user_id !== auth.userId) throw new Error("collection_not_executable");
  const items = [...(collection.skill_collection_items ?? [])].sort((a, b) => Number(a.position) - Number(b.position));
  if (!items.length) throw new Error("collection_empty");
  if (items.length > 10) throw new Error("collection_execution_limit");
  const completed: unknown[] = [];
  for (const item of items) {
    const childHash = await sha256BytesHex(new TextEncoder().encode(`${requestId}:${collectionId}:${item.position}:${item.skill_id}`));
    try { completed.push(await getSkillMd(auth, item.skill_id, `collection:${childHash}`)); }
    catch (error) {
      return {status: "stopped", collectionId, requestId, completed, failed: {position: item.position, skillId: item.skill_id, error: error instanceof Error ? error.message : "skill_execution_failed"}, creditsCharged: completed.reduce<number>((sum, value) => sum + Number((value as {creditsCharged?: number}).creditsCharged ?? 0), 0)};
    }
  }
  return {status: "completed", collectionId, requestId, completed, creditsCharged: completed.reduce<number>((sum, value) => sum + Number((value as {creditsCharged?: number}).creditsCharged ?? 0), 0)};
}

async function toggleSkill(auth: AuthenticatedMcpKey, skillId: string, enabled: boolean) {
  const {data: skill, error} = await admin.from("skills").select("id,visibility,owner_id,status").eq("id", skillId).eq("status", "active").maybeSingle();
  if (error) throw new Error(error.message);
  if (!skill || (skill.visibility === "private" && skill.owner_id !== auth.userId)) throw new Error("skill_not_available");

  const {data, error: upsertError} = await admin.from("user_skill_library").upsert(
    {user_id: auth.userId, skill_id: skillId, enabled},
    {onConflict: "user_id,skill_id"},
  ).select("skill_id,enabled,added_at").single();
  if (upsertError) throw new Error(upsertError.message);
  return data;
}

async function getUsageSummary(auth: AuthenticatedMcpKey) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [balanceResult, usageResult, callResult, enabledResult] = await Promise.all([
    admin.from("user_credit_balances").select("available_units").eq("user_id", auth.userId).maybeSingle(),
    admin.from("usage_events").select("id,units,status,tool_name,created_at").eq("user_id", auth.userId).gte("created_at", monthStart.toISOString()).order("created_at", {ascending: false}).limit(1000),
    admin.from("mcp_call_events").select("id,tool_name,created_at").eq("user_id", auth.userId).gte("created_at", monthStart.toISOString()).order("created_at", {ascending: false}).limit(1000),
    admin.from("user_skill_library").select("id", {count: "exact", head: true}).eq("user_id", auth.userId).eq("enabled", true),
  ]);
  if (balanceResult.error || usageResult.error || callResult.error || enabledResult.error) throw new Error((balanceResult.error ?? usageResult.error ?? callResult.error ?? enabledResult.error)?.message ?? "summary_failed");
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

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("MCP endpoint expects POST", {status: 405});
  }

  let body: RpcRequest;
  try {
    body = await request.json() as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  let auth: AuthenticatedMcpKey | null;
  try {
    auth = await authenticateMcpRequest(request);
  } catch {
    return rpcError(body.id, -32603, "Authentication service unavailable.", 503, {errorCode: "AUTH_SERVICE_UNAVAILABLE", retryable: true});
  }
  if (!auth) return rpcError(body.id, -32001, "The API key is invalid or has been revoked.", 401, {errorCode: "INVALID_API_KEY", retryable: false});
  if (limited(auth.apiKeyId)) return rpcError(body.id, -32029, "Rate limit exceeded. Retry after one minute.", 429, {errorCode: "RATE_LIMIT_EXCEEDED", retryable: true});

  if (body.method === "initialize") {
    return rpc(body.id, {protocolVersion: "2025-06-18", capabilities: {tools: {}}, serverInfo: {name: "OceanSkill", version: "1.0.0"}});
  }
  if (body.method === "notifications/initialized") return new Response(null, {status: 202});
  if (body.method === "tools/list") {
    return rpc(body.id, {tools: [
      {name: "list_purchased_skills", description: "List enabled public and caller-owned private OceanSkill skills available through MCP.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
      {name: "search_skills", description: "Search available skill metadata without exposing protected content.", inputSchema: {type: "object", properties: {query: {type: "string", minLength: 1, maxLength: 80}}, required: ["query"], additionalProperties: false}},
      {name: "get_skill_md", description: "Download a permitted skill's scanned current SKILL.md directly from private Storage. A successful new request costs 1 credit; the same requestId can replay the same call for 10 minutes without another charge.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, requestId: {type: "string", maxLength: 120}}, required: ["skillId"], additionalProperties: false}},
      {name: "get_skill_reference", description: "Download one publish-time hash-pinned reference file for a permitted skill's current version. SKILL.md is reserved for get_skill_md and cannot be retrieved here. Text is UTF-8 and binary content is base64. A successful new request costs 1 credit; the same requestId can replay the same call for 10 minutes without another charge.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, referenceKey: {type: "string", minLength: 1, maxLength: 240}, requestId: {type: "string", maxLength: 120}}, required: ["skillId", "referenceKey"], additionalProperties: false}},
      {name: "list_collections", description: "List public collections and the caller's own collections.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
      {name: "add_collection_to_library", description: "Add a public or owned collection to the caller's library and enable its skills.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
      {name: "create_skill_collection", description: "Create a private user collection. Names and slugs must be unique for this user.", inputSchema: {type: "object", properties: {name: {type: "string", minLength: 1, maxLength: 120}, slug: {type: "string", minLength: 3, maxLength: 80}, description: {type: "string", maxLength: 500}, accent: {type: "string", enum: ["primary", "secondary", "tertiary"]}, skillIds: {type: "array", minItems: 1, maxItems: 100, uniqueItems: true, items: {type: "string", format: "uuid"}}}, required: ["name", "slug", "skillIds"], additionalProperties: false}},
      {name: "update_skill_collection", description: "Rename a caller-owned collection and replace its ordered skill list. Platform collections are read-only.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}, name: {type: "string", minLength: 1, maxLength: 120}, slug: {type: "string", minLength: 3, maxLength: 80}, description: {type: "string", maxLength: 500}, skillIds: {type: "array", minItems: 1, maxItems: 100, uniqueItems: true, items: {type: "string", format: "uuid"}}}, required: ["collectionId", "name", "slug", "skillIds"], additionalProperties: false}},
      {name: "delete_skill_collection", description: "Delete a caller-owned collection. Platform collections cannot be deleted.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
      {name: "execute_skill_collection", description: "Retrieve SKILL.md sequentially for up to 10 skills in a caller-owned collection. Each successful skill retrieval costs 1 credit; execution stops on the first failure. Platform collections are read-only and cannot be executed directly.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}, requestId: {type: "string", minLength: 1, maxLength: 120}}, required: ["collectionId"], additionalProperties: false}},
      {name: "toggle_skill", description: "Enable or disable a skill in the caller's library without fetching paid content.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, enabled: {type: "boolean"}}, required: ["skillId", "enabled"], additionalProperties: false}},
      {name: "get_usage_summary", description: "Return current credits and month-to-date MCP usage summary.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
    ]});
  }
  if (body.method !== "tools/call") return rpcError(body.id, -32601, "Method not found", 404);

  const name = typeof body.params?.name === "string" ? body.params.name : "";
  const args = body.params?.arguments && typeof body.params.arguments === "object" ? body.params.arguments as Record<string, unknown> : {};
  const requestId = typeof args.requestId === "string" ? args.requestId : undefined;
  if (requestId !== undefined && (!requestId.trim() || requestId.length > 120)) {
    return rpcError(body.id, -32602, "requestId must contain 1 to 120 characters.", 400, {errorCode: "INVALID_REQUEST_ID", retryable: false, requestId});
  }

  try {
    let value: unknown;
    let toolName: McpToolName;
    if (name === "list_purchased_skills") { toolName = "list_purchased_skills"; value = await listAvailableSkills(auth); }
    else if (name === "search_skills" && typeof args.query === "string") { toolName = "search_skills"; value = await searchAvailableSkills(auth, args.query); }
    else if (name === "get_skill_md" && typeof args.skillId === "string") { toolName = "get_skill_md"; value = await getSkillMd(auth, args.skillId, requestId); }
    else if (name === "get_skill_reference" && typeof args.skillId === "string" && typeof args.referenceKey === "string") { toolName = "get_skill_reference"; value = await getSkillReference(auth, args.skillId, args.referenceKey, requestId); }
    else if (name === "list_collections") { toolName = "list_collections"; value = await listCollections(auth); }
    else if (name === "add_collection_to_library" && typeof args.collectionId === "string") { toolName = "add_collection_to_library"; value = await addCollectionToLibrary(auth, args.collectionId); }
    else if (name === "create_skill_collection" && typeof args.name === "string" && typeof args.slug === "string" && Array.isArray(args.skillIds)) { toolName = "create_skill_collection"; value = await createSkillCollection(auth, {name: args.name, slug: args.slug, description: typeof args.description === "string" ? args.description : undefined, accent: typeof args.accent === "string" ? args.accent : undefined, skillIds: args.skillIds.filter((id): id is string => typeof id === "string")}); }
    else if (name === "update_skill_collection" && typeof args.collectionId === "string" && typeof args.name === "string" && typeof args.slug === "string" && Array.isArray(args.skillIds)) { toolName = "update_skill_collection"; value = await updateSkillCollection(auth, args.collectionId, {name: args.name, slug: args.slug, description: typeof args.description === "string" ? args.description : undefined, skillIds: args.skillIds.filter((id): id is string => typeof id === "string")}); }
    else if (name === "delete_skill_collection" && typeof args.collectionId === "string") { toolName = "delete_skill_collection"; value = await deleteSkillCollection(auth, args.collectionId); }
    else if (name === "execute_skill_collection" && typeof args.collectionId === "string") { toolName = "execute_skill_collection"; value = await executeSkillCollection(auth, args.collectionId, requestId); }
    else if (name === "toggle_skill" && typeof args.skillId === "string" && typeof args.enabled === "boolean") { toolName = "toggle_skill"; value = await toggleSkill(auth, args.skillId, args.enabled); }
    else if (name === "get_usage_summary") { toolName = "get_usage_summary"; value = await getUsageSummary(auth); }
    else return rpcError(body.id, -32602, "Invalid tool name or arguments");
    await recordMcpCall(auth, toolName, requestId).catch(() => undefined);
    return rpc(body.id, {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value});
  } catch (error) {
    let failure: McpToolError;
    const message = error instanceof Error ? error.message : "tool_failed";
    if (error instanceof McpToolError) failure = error;
    else if (message === "skill_not_available") failure = new McpToolError("SKILL_NOT_AVAILABLE", "This skill is unavailable or you do not have access to it.", 403, false, requestId);
    else if (message === "skill_not_in_user_library") failure = new McpToolError("SKILL_NOT_ENABLED", "This skill is not enabled in your library.", 403, false, requestId);
    else if (message === "collection_not_available") failure = new McpToolError("COLLECTION_NOT_AVAILABLE", "This collection is unavailable or you do not have access to it.", 403, false, requestId);
    else if (message === "collection_not_editable" || message === "collection_not_deletable" || message === "collection_not_executable") failure = new McpToolError("PLATFORM_COLLECTION_READ_ONLY", "Platform collections are read-only. Add one to your library, then create your own collection to edit or execute it.", 403, false, requestId);
    else if (message === "collection_duplicate") failure = new McpToolError("COLLECTION_DUPLICATE", "A collection with this name or slug already exists in your account.", 409, false, requestId);
    else if (message === "collection_empty" || message === "collection_execution_limit") failure = new McpToolError("COLLECTION_EXECUTION_INVALID", message === "collection_empty" ? "This collection has no skills to execute." : "A collection execution is limited to 10 skills.", 400, false, requestId);
    else if (message.startsWith("invalid_collection")) failure = new McpToolError("INVALID_COLLECTION", "The collection input is invalid.", 400, false, requestId);
    else if (message === "insufficient_credits") failure = new McpToolError("INSUFFICIENT_CREDITS", "Not enough credits to complete this request.", 402, false, requestId);
    else if (message === "version_not_available") failure = new McpToolError("VERSION_NOT_AVAILABLE", "The skill's current scanned version is unavailable.", 409, true, requestId);
    else if (message === "skill_md_not_available") failure = new McpToolError("SKILL_MD_NOT_AVAILABLE", "This skill version does not have a verified SKILL.md object in Storage. No credit was charged.", 409, false, requestId);
    else if (message === "skill_md_not_verified") failure = new McpToolError("SKILL_MD_NOT_VERIFIED", "This Storage SKILL.md has not passed the publish review gate. No credit was charged.", 409, false, requestId);
    else if (message === "skill_md_too_large") failure = new McpToolError("SKILL_MD_TOO_LARGE", "This SKILL.md exceeds the 1 MB MCP response limit. No credit was charged.", 413, false, requestId);
    else if (message === "skill_md_download_failed") failure = new McpToolError("SKILL_MD_DOWNLOAD_FAILED", "SKILL.md could not be downloaded from Storage. No credit was charged.", 503, true, requestId);
    else if (message === "skill_md_hash_mismatch") failure = new McpToolError("SKILL_MD_HASH_MISMATCH", "The Storage object changed after verification. Publish a new verified version before retrying. No credit was charged.", 409, false, requestId);
    else if (message === "skill_md_invalid_utf8") failure = new McpToolError("SKILL_MD_INVALID_UTF8", "The Storage object is not valid UTF-8 Markdown. No credit was charged.", 422, false, requestId);
    else if (message === "reference_key_reserved") failure = new McpToolError("REFERENCE_KEY_RESERVED", "SKILL.md is reserved for get_skill_md and cannot be retrieved as a reference. No credit was charged.", 400, false, requestId);
    else if (message === "reference_not_available") failure = new McpToolError("REFERENCE_NOT_AVAILABLE", "This reference is not mapped to the skill's current version.", 404, false, requestId);
    else if (message === "reference_not_verified") failure = new McpToolError("REFERENCE_NOT_VERIFIED", "This reference was not hash-pinned at publish time. Publish a verified version before retrying. No credit was charged.", 409, false, requestId);
    else if (message === "reference_hash_mismatch") failure = new McpToolError("REFERENCE_HASH_MISMATCH", "The reference Storage object changed after publish verification. Publish a new verified version before retrying. No credit was charged.", 409, false, requestId);
    else if (message === "reference_too_large") failure = new McpToolError("REFERENCE_TOO_LARGE", "This reference exceeds the 1 MB MCP response limit.", 413, false, requestId);
    else if (message === "reference_download_failed") failure = new McpToolError("REFERENCE_DOWNLOAD_FAILED", "The reference could not be downloaded from Storage. No credit was charged.", 503, true, requestId);
    else {
      console.error("mcp_tool_failed", {toolName: name, requestId, error});
      failure = new McpToolError("INTERNAL_ERROR", "An unexpected server error occurred while processing this MCP tool call.", 500, true, requestId);
    }
    return rpcError(body.id, -32000, failure.message, failure.status, {
      errorCode: failure.errorCode,
      retryable: failure.retryable,
      ...(failure.requestId ? {requestId: failure.requestId} : {}),
      ...(failure.previousErrorCode !== undefined ? {previousErrorCode: failure.previousErrorCode} : {}),
    });
  }
});
