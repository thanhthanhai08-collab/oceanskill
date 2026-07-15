import "server-only";
import {createClient} from "@/lib/supabase/server";

export type UsageEvent = Readonly<{
  id: string;
  tool_name: string;
  skill_id: string | null;
  units: number;
  status: string;
  created_at: string;
  skills?: {title: string; category: string} | {title: string; category: string}[] | null;
}>;

export type McpCallEvent = Readonly<{
  id: string;
  tool_name: string;
  api_key_id: string;
  request_id: string | null;
  status: string;
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
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,category)")
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
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,category)")
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
  const mcpCalls = (mcpCallData ?? []) as Array<Omit<McpCallEvent, "status">>;
  const requestIds = [...new Set(mcpCalls.map((event) => event.request_id).filter((value): value is string => Boolean(value)))];
  const statusByRequestId = new Map<string, string>();
  if (requestIds.length) {
    const {data: statusRows, error: statusError} = await supabase
      .from("usage_events")
      .select("request_id,status")
      .eq("user_id", String(userId))
      .in("request_id", requestIds);
    if (statusError) throw new Error(`Could not load usage status: ${statusError.message}`);
    for (const row of statusRows ?? []) statusByRequestId.set(String(row.request_id), String(row.status));
  }

  return {
    events: (data ?? []) as UsageEvent[],
    analyticsEvents: (analyticsData ?? []) as UsageEvent[],
    mcpCallEvents: mcpCalls.map((event) => ({...event, status: event.request_id ? statusByRequestId.get(event.request_id) ?? "succeeded" : "succeeded"})),
    totalMcpCalls: mcpCallCount ?? 0,
    paidTotal: count ?? 0,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
