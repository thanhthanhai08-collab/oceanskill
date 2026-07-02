import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";

export async function reserveMcpUsage(input: {userId: string; apiKeyId: string; skillId: string; toolName: "list_purchased_skills" | "get_skill_content" | "search_skills"; requestId: string; units?: number}) {
  const {data, error} = await createAdminClient().rpc("reserve_mcp_usage", {
    p_user_id: input.userId, p_api_key_id: input.apiKeyId, p_skill_id: input.skillId,
    p_tool_name: input.toolName, p_request_id: input.requestId, p_units: input.units ?? 1
  });
  if (error) throw new Error(`Could not reserve MCP usage: ${error.message}`);
  return Array.isArray(data) ? data[0] : data;
}

export async function finalizeMcpUsage(requestId: string) {
  const {data, error} = await createAdminClient().rpc("finalize_mcp_usage", {p_request_id: requestId});
  if (error) throw new Error(`Could not finalize MCP usage: ${error.message}`);
  return Boolean(data);
}

export async function releaseMcpUsage(requestId: string, errorCode: string) {
  const {data, error} = await createAdminClient().rpc("release_mcp_usage", {p_request_id: requestId, p_error_code: errorCode});
  if (error) throw new Error(`Could not release MCP usage: ${error.message}`);
  return Boolean(data);
}
