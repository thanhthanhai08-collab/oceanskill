import {NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export async function POST(_request: Request, {params}: {params: Promise<{skillId: string}>}) {
  const {skillId} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  const {error} = await supabase
    .from("user_skill_library")
    .insert({user_id: String(userId), skill_id: skillId});

  if (error?.code === "23505") {
    return NextResponse.json({status: "already"}, {headers: {"Cache-Control": "no-store"}});
  }
  if (error) return NextResponse.json({error: "add_skill_failed"}, {status: 500});
  revalidatePath("/vi/dashboard/skills");
  revalidatePath("/en/dashboard/skills");
  return NextResponse.json({status: "added"}, {headers: {"Cache-Control": "no-store"}});
}

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
