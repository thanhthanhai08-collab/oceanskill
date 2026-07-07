import {createClient} from "https://esm.sh/@supabase/supabase-js@2";

type RpcRequest = Readonly<{
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}>;

type AuthenticatedMcpKey = Readonly<{apiKeyId: string; userId: string}>;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {autoRefreshToken: false, persistSession: false},
});

const metadataFields = "id,slug,title,description,domain,current_version,compatible_clients,license_spdx,visibility,updated_at";
const windows = new Map<string, {count: number; resetAt: number}>();

function rpc(id: RpcRequest["id"], result: unknown, status = 200) {
  return Response.json({jsonrpc: "2.0", id: id ?? null, result}, {status, headers: {"Cache-Control": "no-store"}});
}

function rpcError(id: RpcRequest["id"], code: number, message: string, status = 400) {
  return Response.json({jsonrpc: "2.0", id: id ?? null, error: {code, message}}, {status, headers: {"Cache-Control": "no-store"}});
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

async function reserveMcpUsage(input: {userId: string; apiKeyId: string; skillId: string; requestId: string}) {
  const {data, error} = await admin.rpc("reserve_mcp_usage", {
    p_user_id: input.userId,
    p_api_key_id: input.apiKeyId,
    p_skill_id: input.skillId,
    p_tool_name: "get_skill_content",
    p_request_id: input.requestId,
    p_units: 1,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

async function finalizeMcpUsage(requestId: string) {
  const {error} = await admin.rpc("finalize_mcp_usage", {p_request_id: requestId});
  if (error) throw new Error(error.message);
}

async function releaseMcpUsage(requestId: string, errorCode: string) {
  const {error} = await admin.rpc("release_mcp_usage", {p_request_id: requestId, p_error_code: errorCode});
  if (error) throw new Error(error.message);
}

async function getSkillContent(auth: AuthenticatedMcpKey, skillId: string, requestId = crypto.randomUUID()) {
  const {data: skill, error} = await admin.from("skills")
    .select(`${metadataFields},owner_id,skill_versions!inner(id,version,content_md,content_hash,scan_status)`)
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

  const reservation = await reserveMcpUsage({userId: auth.userId, apiKeyId: auth.apiKeyId, skillId, requestId});
  if (!reservation || reservation.result === "insufficient_credits") throw new Error("insufficient_credits");

  try {
    const versions = Array.isArray(skill.skill_versions) ? skill.skill_versions : [];
    const version = versions.find((item) => item.version === skill.current_version);
    if (!version) throw new Error("version_not_available");
    await finalizeMcpUsage(requestId);
    const publicSkill = {...skill};
    delete publicSkill.owner_id;
    delete publicSkill.skill_versions;
    return {skill: publicSkill, version: version.version, content: version.content_md, contentHash: version.content_hash};
  } catch (error) {
    await releaseMcpUsage(requestId, error instanceof Error ? error.message : "execution_failed");
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
  const [balanceResult, usageResult, enabledResult] = await Promise.all([
    admin.from("user_credit_balances").select("available_units").eq("user_id", auth.userId).maybeSingle(),
    admin.from("usage_events").select("id,units,status,tool_name,created_at").eq("user_id", auth.userId).gte("created_at", monthStart.toISOString()).order("created_at", {ascending: false}).limit(1000),
    admin.from("user_skill_library").select("id", {count: "exact", head: true}).eq("user_id", auth.userId).eq("enabled", true),
  ]);
  if (balanceResult.error || usageResult.error || enabledResult.error) throw new Error((balanceResult.error ?? usageResult.error ?? enabledResult.error)?.message ?? "summary_failed");
  const events = usageResult.data ?? [];
  const succeeded = events.filter((event) => event.status === "succeeded");
  const spentUnits = succeeded.reduce((sum, event) => sum + Number(event.units ?? 0), 0);
  return {
    availableCredits: Number(balanceResult.data?.available_units ?? 0),
    monthStart: monthStart.toISOString(),
    monthlyCalls: events.length,
    monthlySucceededCalls: succeeded.length,
    monthlySpentCredits: spentUnits,
    enabledSkills: enabledResult.count ?? 0,
    recentUsage: events.slice(0, 10),
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
    return rpcError(body.id, -32603, "Authentication service unavailable", 503);
  }
  if (!auth) return rpcError(body.id, -32001, "Invalid or revoked API key", 401);
  if (limited(auth.apiKeyId)) return rpcError(body.id, -32029, "Rate limit exceeded", 429);

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

  try {
    let value: unknown;
    if (name === "list_purchased_skills") value = await listAvailableSkills(auth);
    else if (name === "search_skills" && typeof args.query === "string") value = await searchAvailableSkills(auth, args.query);
    else if (name === "get_skill_content" && typeof args.skillId === "string") value = await getSkillContent(auth, args.skillId, typeof args.requestId === "string" ? args.requestId : undefined);
    else if (name === "list_collections") value = await listCollections(auth);
    else if (name === "add_collection_to_library" && typeof args.collectionId === "string") value = await addCollectionToLibrary(auth, args.collectionId);
    else if (name === "toggle_skill" && typeof args.skillId === "string" && typeof args.enabled === "boolean") value = await toggleSkill(auth, args.skillId, args.enabled);
    else if (name === "get_usage_summary") value = await getUsageSummary(auth);
    else return rpcError(body.id, -32602, "Invalid tool name or arguments");
    return rpc(body.id, {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value});
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    const status = message === "skill_not_available" || message === "skill_not_in_user_library" || message === "collection_not_available" ? 403 : message === "insufficient_credits" ? 402 : 500;
    return rpcError(body.id, -32000, message, status);
  }
});
