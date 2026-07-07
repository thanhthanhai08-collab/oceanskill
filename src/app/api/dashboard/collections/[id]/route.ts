import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getUserSkillCollections} from "@/lib/skills/collections";

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  const {error} = await supabase
    .from("skill_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({error: "collection_delete_failed"}, {status: 500});
  const collections = await getUserSkillCollections();
  return NextResponse.json({collections: collections ?? []}, {headers: {"Cache-Control": "no-store"}});
}
