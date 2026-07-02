import "server-only";
import {createHash} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";

export type AuthenticatedMcpKey = Readonly<{apiKeyId: string; userId: string}>;

export async function authenticateMcpRequest(request: Request): Promise<AuthenticatedMcpKey | null> {
  const authorization = request.headers.get("authorization") ?? "";
  const rawKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!/^nsk_[A-Za-z0-9_-]{40,}$/.test(rawKey)) return null;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();
  const {data, error} = await admin.rpc("resolve_mcp_api_key", {p_key_hash: keyHash});
  if (error) throw new Error(`MCP authentication failed: ${error.message}`);
  const match = Array.isArray(data) ? data[0] : data;
  if (!match?.api_key_id || !match?.user_id) return null;
  await admin.from("api_keys").update({last_used_at: new Date().toISOString()}).eq("id", match.api_key_id);
  return {apiKeyId: String(match.api_key_id), userId: String(match.user_id)};
}
