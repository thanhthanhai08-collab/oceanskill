import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import type {AuthenticatedMcpKey} from "@/lib/mcp/authentication";

export async function reserveMcpUsage(input: {
  auth: AuthenticatedMcpKey;
  skillId: string;
  skillVersionId: string;
  toolName: "get_skill_md" | "get_skill_reference";
  requestId: string;
  resourceKey?: string;
}) {
  const {data, error} = await createAdminClient().rpc("reserve_mcp_usage_resource_versioned", {
    p_user_id: input.auth.userId,
    p_api_key_id: input.auth.apiKeyId,
    p_skill_id: input.skillId,
    p_skill_version_id: input.skillVersionId,
    p_tool_name: input.toolName,
    p_request_id: input.requestId,
    p_resource_key: input.resourceKey ?? null,
    p_units: 1,
  });
  if (error) throw new Error("usage_reservation_failed");
  return Array.isArray(data) ? data[0] : data;
}

export async function finalizeMcpUsage(requestId: string) {
  const {data, error} = await createAdminClient().rpc("finalize_mcp_usage", {p_request_id: requestId});
  if (error || data !== true) throw new Error("usage_finalization_failed");
}

export async function releaseMcpUsage(requestId: string, errorCode: string) {
  const {error} = await createAdminClient().rpc("release_mcp_usage", {p_request_id: requestId, p_error_code: errorCode});
  if (error) throw new Error("usage_release_failed");
}
