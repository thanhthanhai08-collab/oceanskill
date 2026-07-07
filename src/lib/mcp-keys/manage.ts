import "server-only";
import {createClient} from "@/lib/supabase/server";

export type McpKey = Readonly<{
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}>;

export async function getUserMcpKeys() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const {data, error} = await supabase
    .from("api_keys")
    .select("id,name,key_prefix,last_used_at,revoked_at,created_at")
    .eq("user_id", String(userId))
    .order("created_at", {ascending: false});

  if (error) throw new Error(`Could not load MCP keys: ${error.message}`);
  return {claims: claimsData.claims, keys: (data ?? []) as McpKey[]};
}
