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

export async function getUsageEvents({page = 1, limit = 20}: {page?: number; limit?: number} = {}) {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [{data, error}, {count, error: countError}, {data: analyticsData, error: analyticsError}] = await Promise.all([
    supabase.from("usage_events")
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,domain)")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false})
      .range(from, to),
    supabase.from("usage_events")
      .select("id", {count: "exact", head: true})
      .eq("user_id", String(userId)),
    supabase.from("usage_events")
      .select("id,tool_name,skill_id,units,status,created_at,skills(title,domain)")
      .eq("user_id", String(userId))
      .order("created_at", {ascending: false})
      .limit(1000),
  ]);

  if (error ?? countError ?? analyticsError) throw new Error(`Could not load usage events: ${(error ?? countError ?? analyticsError)?.message}`);

  return {
    events: (data ?? []) as UsageEvent[],
    analyticsEvents: (analyticsData ?? []) as UsageEvent[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
