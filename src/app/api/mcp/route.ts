import {NextResponse} from "next/server";
import {authenticateMcpRequest} from "@/lib/mcp/authentication";
import {addCollectionToLibrary, createSkillCollection, deleteSkillCollection, executeSkillCollection, getSkillMd, getSkillReference, getUsageSummary, listAvailableSkills, listCollections, recordMcpCall, searchAvailableSkills, toggleSkill, updateSkillCollection, type McpToolName} from "@/lib/mcp/tools";

type RpcRequest = Readonly<{jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown>}>;
const windows = new Map<string, {count: number; resetAt: number}>();

function rpc(id: RpcRequest["id"], result: unknown, status = 200) { return NextResponse.json({jsonrpc: "2.0", id: id ?? null, result}, {status, headers: {"Cache-Control": "no-store"}}); }
function rpcError(id: RpcRequest["id"], code: number, message: string, status = 400) { return NextResponse.json({jsonrpc: "2.0", id: id ?? null, error: {code, message}}, {status, headers: {"Cache-Control": "no-store"}}); }

function limited(key: string) {
  const now = Date.now(); const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) { windows.set(key, {count: 1, resetAt: now + 60_000}); return false; }
  existing.count += 1; return existing.count > 60;
}

export async function POST(request: Request) {
  let body: RpcRequest;
  try { body = await request.json() as RpcRequest; } catch { return rpcError(null, -32700, "Parse error"); }
  let auth;
  try { auth = await authenticateMcpRequest(request); } catch { return rpcError(body.id, -32603, "Authentication service unavailable", 503); }
  if (!auth) return rpcError(body.id, -32001, "Invalid or revoked API key", 401);
  if (limited(auth.apiKeyId)) return rpcError(body.id, -32029, "Rate limit exceeded", 429);
  if (body.method === "initialize") return rpc(body.id, {protocolVersion: "2025-06-18", capabilities: {tools: {}}, serverInfo: {name: "OceanSkill", version: "1.0.0"}});
  if (body.method === "notifications/initialized") return new NextResponse(null, {status: 202});
  if (body.method === "tools/list") return rpc(body.id, {tools: [
    {name: "list_purchased_skills", description: "List enabled public and caller-owned private OceanSkill skills available through MCP.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
    {name: "search_skills", description: "Search available skill metadata without exposing protected content.", inputSchema: {type: "object", properties: {query: {type: "string", minLength: 1, maxLength: 80}}, required: ["query"], additionalProperties: false}},
    {name: "get_skill_md", description: "Download a permitted skill's scanned current SKILL.md directly from private Storage. A successful new request costs 1 credit; an exact replay is free for 10 minutes.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, requestId: {type: "string", maxLength: 120}}, required: ["skillId"], additionalProperties: false}},
    {name: "get_skill_reference", description: "Download one publish-time hash-pinned reference file for a permitted skill's current version. SKILL.md is reserved for get_skill_md. A successful new request costs 1 credit; an exact replay is free for 10 minutes.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, referenceKey: {type: "string", minLength: 1, maxLength: 240}, requestId: {type: "string", maxLength: 120}}, required: ["skillId", "referenceKey"], additionalProperties: false}},
    {name: "list_collections", description: "List public collections and the caller's own collections.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
    {name: "add_collection_to_library", description: "Add a public or owned collection to the caller's library and enable its skills.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
    {name: "create_skill_collection", description: "Create a private user collection. Names and slugs must be unique for this user.", inputSchema: {type: "object", properties: {name: {type: "string", minLength: 1, maxLength: 120}, slug: {type: "string", minLength: 3, maxLength: 80}, description: {type: "string", maxLength: 500}, accent: {type: "string", enum: ["primary", "secondary", "tertiary"]}, skillIds: {type: "array", minItems: 1, maxItems: 100, uniqueItems: true, items: {type: "string", format: "uuid"}}}, required: ["name", "slug", "skillIds"], additionalProperties: false}},
    {name: "update_skill_collection", description: "Rename a caller-owned collection and replace its ordered skill list. Platform collections are read-only.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}, name: {type: "string", minLength: 1, maxLength: 120}, slug: {type: "string", minLength: 3, maxLength: 80}, description: {type: "string", maxLength: 500}, skillIds: {type: "array", minItems: 1, maxItems: 100, uniqueItems: true, items: {type: "string", format: "uuid"}}}, required: ["collectionId", "name", "slug", "skillIds"], additionalProperties: false}},
    {name: "delete_skill_collection", description: "Delete a caller-owned collection. Platform collections cannot be deleted.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
    {name: "execute_skill_collection", description: "Retrieve SKILL.md sequentially for up to 10 skills in a caller-owned collection. Each successful skill retrieval costs 1 credit; execution stops on the first failure. Platform collections are read-only and cannot be executed directly.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}, requestId: {type: "string", minLength: 1, maxLength: 120}}, required: ["collectionId"], additionalProperties: false}},
    {name: "toggle_skill", description: "Enable or disable a skill in the caller's library without fetching paid content.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, enabled: {type: "boolean"}}, required: ["skillId", "enabled"], additionalProperties: false}},
    {name: "get_usage_summary", description: "Return current credits and month-to-date MCP usage summary.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
  ]});
  if (body.method !== "tools/call") return rpcError(body.id, -32601, "Method not found", 404);
  const name = typeof body.params?.name === "string" ? body.params.name : "";
  const args = body.params?.arguments && typeof body.params.arguments === "object" ? body.params.arguments as Record<string, unknown> : {};
  try {
    let value: unknown;
    let toolName: McpToolName;
    if (name === "list_purchased_skills") { toolName = "list_purchased_skills"; value = await listAvailableSkills(auth); }
    else if (name === "search_skills" && typeof args.query === "string") { toolName = "search_skills"; value = await searchAvailableSkills(auth, args.query); }
    else if (name === "get_skill_md" && typeof args.skillId === "string") { toolName = "get_skill_md"; value = await getSkillMd(auth, args.skillId, typeof args.requestId === "string" ? args.requestId : undefined); }
    else if (name === "get_skill_reference" && typeof args.skillId === "string" && typeof args.referenceKey === "string") { toolName = "get_skill_reference"; value = await getSkillReference(auth, args.skillId, args.referenceKey, typeof args.requestId === "string" ? args.requestId : undefined); }
    else if (name === "list_collections") { toolName = "list_collections"; value = await listCollections(auth); }
    else if (name === "add_collection_to_library" && typeof args.collectionId === "string") { toolName = "add_collection_to_library"; value = await addCollectionToLibrary(auth, args.collectionId); }
    else if (name === "create_skill_collection" && typeof args.name === "string" && typeof args.slug === "string" && Array.isArray(args.skillIds)) { toolName = "create_skill_collection"; value = await createSkillCollection(auth, {name: args.name, slug: args.slug, description: typeof args.description === "string" ? args.description : undefined, accent: typeof args.accent === "string" ? args.accent : undefined, skillIds: args.skillIds.filter((id): id is string => typeof id === "string")}); }
    else if (name === "update_skill_collection" && typeof args.collectionId === "string" && typeof args.name === "string" && typeof args.slug === "string" && Array.isArray(args.skillIds)) { toolName = "update_skill_collection"; value = await updateSkillCollection(auth, args.collectionId, {name: args.name, slug: args.slug, description: typeof args.description === "string" ? args.description : undefined, skillIds: args.skillIds.filter((id): id is string => typeof id === "string")}); }
    else if (name === "delete_skill_collection" && typeof args.collectionId === "string") { toolName = "delete_skill_collection"; value = await deleteSkillCollection(auth, args.collectionId); }
    else if (name === "execute_skill_collection" && typeof args.collectionId === "string") { toolName = "execute_skill_collection"; value = await executeSkillCollection(auth, args.collectionId, typeof args.requestId === "string" ? args.requestId : undefined); }
    else if (name === "toggle_skill" && typeof args.skillId === "string" && typeof args.enabled === "boolean") { toolName = "toggle_skill"; value = await toggleSkill(auth, args.skillId, args.enabled); }
    else if (name === "get_usage_summary") { toolName = "get_usage_summary"; value = await getUsageSummary(auth); }
    else return rpcError(body.id, -32602, "Invalid tool name or arguments");
    await recordMcpCall(auth, toolName, typeof args.requestId === "string" ? args.requestId : undefined).catch(() => undefined);
    return rpc(body.id, {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value});
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    const status = message === "skill_not_available" || message === "skill_not_in_user_library" || message === "collection_not_available" || message === "collection_not_editable" || message === "collection_not_deletable" || message === "collection_not_executable" ? 403
      : message === "insufficient_credits" ? 402
      : message === "reference_key_reserved" || message.startsWith("invalid_") || message === "collection_execution_limit" || message === "collection_empty" ? 400
      : message === "collection_duplicate" ? 409
      : ["skill_md_not_available", "skill_md_not_verified", "skill_md_hash_mismatch", "reference_not_verified", "reference_hash_mismatch"].includes(message) ? 409
      : message === "reference_not_available" ? 404
      : 500;
    return rpcError(body.id, -32000, message, status);
  }
}
