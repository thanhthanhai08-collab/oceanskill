import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getUserSkillCollections} from "@/lib/skills/collections";

type CollectionBody = Readonly<{name?: unknown; description?: unknown; skillIds?: unknown}>;
const accents = ["primary", "secondary", "tertiary"] as const;

function cleanBody(input: unknown) {
  const value = input as CollectionBody;
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  const description = typeof value?.description === "string" ? value.description.trim() : "";
  const skillIds = Array.isArray(value?.skillIds)
    ? [...new Set(value.skillIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  if (!name || name.length > 120) return null;
  if (description.length > 500) return null;
  if (!skillIds.length || skillIds.length > 100) return null;
  return {name, description, skillIds};
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const input = cleanBody(body);
  if (!input) return NextResponse.json({error: "invalid_collection"}, {status: 400});

  const {count} = await supabase
    .from("skill_collections")
    .select("id", {count: "exact", head: true})
    .eq("user_id", userId);

  const {data: collection, error: collectionError} = await supabase
    .from("skill_collections")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      accent: accents[(count ?? 0) % accents.length],
    })
    .select("id")
    .single();

  if (collectionError || !collection) return NextResponse.json({error: "collection_create_failed"}, {status: 500});

  const {error: itemsError} = await supabase
    .from("skill_collection_items")
    .insert(input.skillIds.map((skillId, position) => ({collection_id: collection.id, skill_id: skillId, position})));

  if (itemsError) {
    await supabase.from("skill_collections").delete().eq("id", collection.id).eq("user_id", userId);
    return NextResponse.json({error: "collection_items_create_failed"}, {status: 500});
  }

  const collections = await getUserSkillCollections();
  return NextResponse.json({collections: collections ?? []}, {headers: {"Cache-Control": "no-store"}});
}
