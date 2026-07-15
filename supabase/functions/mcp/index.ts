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

const metadataFields = "id,slug,title,description,domain,current_version,compatible_clients,license_spdx,visibility,updated_at";
const windows = new Map<string, {count: number; resetAt: number}>();
type McpToolName =
  | "list_purchased_skills"
  | "search_skills"
  | "get_skill_content"
  | "list_collections"
  | "add_collection_to_library"
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

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

async function reserveMcpUsage(input: {userId: string; apiKeyId: string; skillId: string; skillVersionId: string; requestId: string}) {
  const {data, error} = await admin.rpc("reserve_mcp_usage_versioned", {
    p_user_id: input.userId,
    p_api_key_id: input.apiKeyId,
    p_skill_id: input.skillId,
    p_skill_version_id: input.skillVersionId,
    p_tool_name: "get_skill_content",
    p_request_id: input.requestId,
    p_units: 1,
  });
  if (error) throw new Error(error.message);
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
    .select("skill_id,skill_version_id,tool_name,status,error_code")
    .eq("user_id", auth.userId)
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getSkillContent(auth: AuthenticatedMcpKey, skillId: string, suppliedRequestId?: string) {
  const requestId = suppliedRequestId ?? crypto.randomUUID();
  const {data: skill, error} = await admin.from("skills")
    .select(`${metadataFields},owner_id,skill_versions!skills_current_version_fkey(id,version,content_md,content_hash,scan_status)`)
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

  const reservation = await reserveMcpUsage({userId: auth.userId, apiKeyId: auth.apiKeyId, skillId, skillVersionId: version.id, requestId});
  if (!reservation) throw new McpToolError("USAGE_RESERVATION_FAILED", "Unable to reserve credit for this request.", 503, true, requestId);
  if (reservation.result === "insufficient_credits") {
    throw new McpToolError("INSUFFICIENT_CREDITS", "Not enough credits to read this skill.", 402, false, requestId);
  }
  if (reservation.result === "version_conflict") {
    throw new McpToolError("VERSION_CHANGED", "The skill version changed while this request was starting. Retry with a new requestId.", 409, true, requestId);
  }

  let replayed = false;
  if (reservation.result === "duplicate") {
    const existing = await getUsageEvent(auth, requestId);
    if (!existing) throw new McpToolError("USAGE_STATE_NOT_FOUND", "The existing request could not be verified.", 503, true, requestId);
    if (hasReplayScopeConflict(existing, {
      skillId,
      skillVersionId: version.id,
      toolName: "get_skill_content",
    })) {
      throw new McpToolError(
        "REQUEST_ID_CONFLICT",
        "This requestId was already used for a different skill, skill version, or MCP tool. Use a new requestId for this operation.",
        409,
        false,
        requestId,
      );
    }
    if (existing.status === "reserved") {
      throw new McpToolError("REQUEST_IN_PROGRESS", "A request with this requestId is still being processed. Retry later with the same requestId.", 409, true, requestId);
    }
    if (existing.status === "failed") {
      throw new McpToolError(
        "REQUEST_PREVIOUSLY_FAILED",
        "A previous request with this requestId failed. Use a new requestId to start a new attempt.",
        409,
        true,
        requestId,
        existing.error_code,
      );
    }
    if (existing.status !== "succeeded") {
      throw new McpToolError("USAGE_STATE_INVALID", "The existing request has an unsupported usage state.", 500, false, requestId);
    }
    replayed = true;
  } else if (reservation.result !== "reserved") {
    throw new McpToolError("USAGE_RESERVATION_INVALID", "The credit reservation returned an unsupported result.", 500, false, requestId);
  }

  try {
    if (!replayed && !(await finalizeMcpUsage(requestId))) {
      throw new McpToolError("USAGE_FINALIZATION_FAILED", "The request completed, but its credit usage could not be finalized.", 503, true, requestId);
    }
    const publicSkill = {...skill};
    delete publicSkill.owner_id;
    delete publicSkill.skill_versions;
    return {
      skill: publicSkill,
      version: version.version,
      content: version.content_md,
      contentHash: version.content_hash,
      requestId,
      replayed,
      creditsCharged: replayed ? 0 : 1,
    };
  } catch (error) {
    if (!replayed) {
      await releaseMcpUsage(requestId, error instanceof McpToolError ? error.errorCode : "EXECUTION_FAILED")
        .catch((releaseError) => console.error("mcp_usage_release_failed", {requestId, releaseError}));
    }
    throw error;
  }
}

async function listCollections(auth: AuthenticatedMcpKey) {
  const {data, error} = await admin
    .from("skill_collections")
    .select("id,name,description,visibility,accent,updated_at,user_id,skill_collection_items(skill_id,position,skills!inner(id,slug,title,description,domain,current_version,compatible_clients,license_spdx,visibility,updated_at))")
    .or(`visibility.eq.public,user_id.eq.${auth.userId}`)
    .order("updated_at", {ascending: false})
    .limit(100);
  if (error) throw new Error(error.message);
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

async function addCollectionToLibrary(auth: AuthenticatedMcpKey, collectionId: string) {
  const {data: collection, error} = await admin
    .from("skill_collections")
    .select("id,user_id,visibility,skill_collection_items(skill_id,position)")
    .eq("id", collectionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!collection || (collection.visibility !== "public" && collection.user_id !== auth.userId)) throw new Error("collection_not_available");

  await admin.from("user_collection_library").upsert({user_id: auth.userId, collection_id: collectionId}, {onConflict: "user_id,collection_id"});
  const skillIds = (collection.skill_collection_items ?? []).map((item) => item.skill_id).filter(Boolean);
  if (skillIds.length) {
    const {error: upsertError} = await admin.from("user_skill_library").upsert(
      skillIds.map((skillId) => ({user_id: auth.userId, skill_id: skillId, enabled: true})),
      {onConflict: "user_id,skill_id"},
    );
    if (upsertError) throw new Error(upsertError.message);
  }
  return {collectionId, addedSkills: skillIds.length, enabled: true};
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
      {name: "get_skill_content", description: "Return a permitted skill's scanned current SKILL.md content.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, requestId: {type: "string", maxLength: 120}}, required: ["skillId"], additionalProperties: false}},
      {name: "list_collections", description: "List public collections and the caller's own collections.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
      {name: "add_collection_to_library", description: "Add a public or owned collection to the caller's library and enable its skills.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
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
    else if (name === "get_skill_content" && typeof args.skillId === "string") { toolName = "get_skill_content"; value = await getSkillContent(auth, args.skillId, requestId); }
    else if (name === "list_collections") { toolName = "list_collections"; value = await listCollections(auth); }
    else if (name === "add_collection_to_library" && typeof args.collectionId === "string") { toolName = "add_collection_to_library"; value = await addCollectionToLibrary(auth, args.collectionId); }
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
    else if (message === "insufficient_credits") failure = new McpToolError("INSUFFICIENT_CREDITS", "Not enough credits to complete this request.", 402, false, requestId);
    else if (message === "version_not_available") failure = new McpToolError("VERSION_NOT_AVAILABLE", "The skill's current scanned version is unavailable.", 409, true, requestId);
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
