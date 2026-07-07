import "server-only";
import {createClient} from "@/lib/supabase/server";

export type DashboardMcpKey = Readonly<{id: string; name: string; key_prefix: string; last_used_at: string | null; revoked_at: string | null; created_at: string}>;
export type DashboardUsage = Readonly<{id: string; tool_name: string; units: number; status: string; created_at: string}>;
export type DashboardOrder = Readonly<{id: string; status: string; amount_vnd: number; credit_units: number; created_at: string}>;

export async function getDashboardOverview() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;
  const userId = String(claims.sub);

  const [keysResult, usageResult, usageCountResult, ordersResult, skillCountResult, balanceResult] = await Promise.all([
    supabase.from("api_keys").select("id,revoked_at").eq("user_id", userId),
    supabase.from("usage_events").select("id,tool_name,units,status,created_at").eq("user_id", userId).order("created_at", {ascending: false}).limit(8),
    supabase.from("usage_events").select("id", {count: "exact", head: true}).eq("user_id", userId),
    supabase.from("payment_orders").select("id,status,amount_vnd,credit_units,created_at").eq("user_id", userId).order("created_at", {ascending: false}).limit(3),
    supabase.from("skills").select("id", {count: "exact", head: true}).eq("owner_id", userId),
    supabase.from("user_credit_balances").select("available_units").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    claims,
    activeKeyCount: (keysResult.data ?? []).filter((k) => !k.revoked_at).length,
    usage: (usageResult.data ?? []) as DashboardUsage[],
    usageCount: usageCountResult.count ?? 0,
    orders: (ordersResult.data ?? []) as DashboardOrder[],
    userSkillCount: skillCountResult.count ?? 0,
    balance: Number(balanceResult.data?.available_units ?? 0),
  };
}
