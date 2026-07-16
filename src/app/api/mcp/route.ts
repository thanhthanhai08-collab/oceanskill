import {NextResponse} from "next/server";
import {authenticateMcpRequest} from "@/lib/mcp/authentication";
import {addCollectionToLibrary, getSkillMd, getSkillReference, getUsageSummary, listAvailableSkills, listCollections, recordMcpCall, searchAvailableSkills, toggleSkill, type McpToolName} from "@/lib/mcp/tools";

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
    {name: "get_skill_md", description: "Return a permitted skill's scanned current SKILL.md. A successful new request costs 1 credit.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, requestId: {type: "string", maxLength: 120}}, required: ["skillId"], additionalProperties: false}},
    {name: "get_skill_reference", description: "Return one mapped reference file for a permitted skill's current version. A successful new request costs 1 credit.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, referenceKey: {type: "string", minLength: 1, maxLength: 240}, requestId: {type: "string", maxLength: 120}}, required: ["skillId", "referenceKey"], additionalProperties: false}},
    {name: "list_collections", description: "List public collections and the caller's own collections.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
    {name: "add_collection_to_library", description: "Add a public or owned collection to the caller's library and enable its skills.", inputSchema: {type: "object", properties: {collectionId: {type: "string", format: "uuid"}}, required: ["collectionId"], additionalProperties: false}},
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
    else if (name === "toggle_skill" && typeof args.skillId === "string" && typeof args.enabled === "boolean") { toolName = "toggle_skill"; value = await toggleSkill(auth, args.skillId, args.enabled); }
    else if (name === "get_usage_summary") { toolName = "get_usage_summary"; value = await getUsageSummary(auth); }
    else return rpcError(body.id, -32602, "Invalid tool name or arguments");
    await recordMcpCall(auth, toolName, typeof args.requestId === "string" ? args.requestId : undefined).catch(() => undefined);
    return rpc(body.id, {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value});
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    const status = message === "skill_not_available" || message === "skill_not_in_user_library" || message === "collection_not_available" ? 403 : message === "insufficient_credits" ? 402 : 500;
    return rpcError(body.id, -32000, message, status);
  }
}
