import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function POST(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const {data, error} = await supabase.rpc("add_skill_collection_to_library", {p_collection_id: id});
  if (error) return NextResponse.json({error: "collection_add_failed"}, {status: 500});
  if (data !== true) return NextResponse.json({error: "collection_not_available"}, {status: 404});
  return NextResponse.json({collectionId: id, added: true}, {headers: {"Cache-Control": "no-store"}});
}
