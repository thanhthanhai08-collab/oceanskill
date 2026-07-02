import {NextResponse} from "next/server";
import {authenticateMcpRequest} from "@/lib/mcp/authentication";
import {getSkillContent, listAvailableSkills, searchAvailableSkills} from "@/lib/mcp/tools";

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
    {name: "list_purchased_skills", description: "List public and caller-owned private OceanSkill skills available through MCP.", inputSchema: {type: "object", properties: {}, additionalProperties: false}},
    {name: "search_skills", description: "Search available skill metadata without exposing protected content.", inputSchema: {type: "object", properties: {query: {type: "string", minLength: 1, maxLength: 80}}, required: ["query"], additionalProperties: false}},
    {name: "get_skill_content", description: "Return a permitted skill's scanned current SKILL.md content.", inputSchema: {type: "object", properties: {skillId: {type: "string", format: "uuid"}, requestId: {type: "string", maxLength: 120}}, required: ["skillId"], additionalProperties: false}},
  ]});
  if (body.method !== "tools/call") return rpcError(body.id, -32601, "Method not found", 404);
  const name = typeof body.params?.name === "string" ? body.params.name : "";
  const args = body.params?.arguments && typeof body.params.arguments === "object" ? body.params.arguments as Record<string, unknown> : {};
  try {
    let value: unknown;
    if (name === "list_purchased_skills") value = await listAvailableSkills(auth);
    else if (name === "search_skills" && typeof args.query === "string") value = await searchAvailableSkills(auth, args.query);
    else if (name === "get_skill_content" && typeof args.skillId === "string") value = await getSkillContent(auth, args.skillId, typeof args.requestId === "string" ? args.requestId : undefined);
    else return rpcError(body.id, -32602, "Invalid tool name or arguments");
    return rpc(body.id, {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value});
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    const status = message === "skill_not_available" ? 403 : message === "insufficient_credits" ? 402 : 500;
    return rpcError(body.id, -32000, message, status);
  }
}
