import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";

export async function POST(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data} = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  const {error} = await createAdminClient()
    .from("api_keys")
    .update({revoked_at: new Date().toISOString()})
    .eq("id", id)
    .eq("user_id", String(userId))
    .is("revoked_at", null);

  if (error) return NextResponse.json({error: "mcp_key_revoke_failed"}, {status: 500});
  return NextResponse.json({ok: true}, {headers: {"Cache-Control": "no-store"}});
}
