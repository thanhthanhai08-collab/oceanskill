import "server-only";
import {createClient} from "@/lib/supabase/server";

export type DashboardProfile = Readonly<{
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}>;

export async function getDashboardProfile() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;
  const userId = String(claims.sub);

  const [profileResult, balanceResult] = await Promise.all([
    supabase.from("profiles").select("id,display_name,email,avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("user_credit_balances").select("available_units").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    claims,
    profile: profileResult.data as DashboardProfile | null,
    balance: Number(balanceResult.data?.available_units ?? 0),
  };
}
