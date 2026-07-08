import "server-only";
import {createClient} from "@/lib/supabase/server";

export type UsageEvent = Readonly<{
  id: string;
  tool_name: string;
  skill_id: string | null;
  units: number;
  status: string;
  created_at: string;
  skills?: {title: string; domain: string} | {title: string; domain: string}[] | null;
}>;

export type McpCallEvent = Readonly<{
  id: string;
  tool_name: string;
  api_key_id: string;
  request_id: string | null;
  created_at: string;
}>;

export type UsageRange = Readonly<{from: string; to: string}>;

function applyRange<T extends {gte: (column: string, value: string) => T; lt: (column: string, value: string) => T}>(query: T, range?: UsageRange) {
  if (!range) return query;
  return query.gte("created_at", range.from).lt("created_at", range.to);
}

export async function getUsageEvents({page = 1, limit = 20, range}: {page?: number; limit?: number; range?: UsageRange} = {}) {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const paidEventsQuery = applyRange(
    supabase.from("usage_events")
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,domain)")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false}),
    range,
  ).range(from, to);
  const paidCountQuery = applyRange(
    supabase.from("usage_events")
      .select("id", {count: "exact", head: true})
      .eq("user_id", String(userId)),
    range,
  );
  const paidAnalyticsQuery = applyRange(
    supabase.from("usage_events")
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,domain)")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false})
      .limit(1000),
    range,
  );
  const mcpCallQuery = applyRange(
    supabase.from("mcp_call_events")
      .select("id,tool_name,api_key_id,request_id,created_at")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false})
      .limit(2000),
    range,
  );
  const mcpCallCountQuery = applyRange(
    supabase.from("mcp_call_events")
      .select("id", {count: "exact", head: true})
      .eq("user_id", String(userId)),
    range,
  );

  const [
    {data, error},
    {count, error: countError},
    {data: analyticsData, error: analyticsError},
    {data: mcpCallData, error: mcpCallError},
    {count: mcpCallCount, error: mcpCallCountError},
  ] = await Promise.all([
    paidEventsQuery,
    paidCountQuery,
    paidAnalyticsQuery,
    mcpCallQuery,
    mcpCallCountQuery,
  ]);

  if (error ?? countError ?? analyticsError ?? mcpCallError ?? mcpCallCountError) {
    throw new Error(`Could not load usage events: ${(error ?? countError ?? analyticsError ?? mcpCallError ?? mcpCallCountError)?.message}`);
  }

  return {
    events: (data ?? []) as UsageEvent[],
    analyticsEvents: (analyticsData ?? []) as UsageEvent[],
    mcpCallEvents: (mcpCallData ?? []) as McpCallEvent[],
    totalMcpCalls: mcpCallCount ?? 0,
    paidTotal: count ?? 0,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
