import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function DELETE(_request: Request, {params}: {params: Promise<{skillId: string}>}) {
  const {skillId} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  const {error} = await supabase
    .from("user_skill_library")
    .delete()
    .eq("user_id", String(userId))
    .eq("skill_id", skillId);

  if (error) return NextResponse.json({error: "remove_skill_failed"}, {status: 500});
  return NextResponse.json({ok: true}, {headers: {"Cache-Control": "no-store"}});
}
