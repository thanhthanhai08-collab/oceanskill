import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getUserSkillCollections} from "@/lib/skills/collections";
import {isValidCollectionSlug, slugifyCollectionName} from "@/lib/skills/collectionSlug";

type CollectionBody = Readonly<{name?: unknown; slug?: unknown; description?: unknown; skillIds?: unknown}>;

function cleanBody(input: unknown) {
  const value = input as CollectionBody;
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  const rawSlug = typeof value?.slug === "string" ? value.slug.trim() : "";
  const slug = rawSlug ? slugifyCollectionName(rawSlug) : slugifyCollectionName(name);
  const description = typeof value?.description === "string" ? value.description.trim() : "";
  const skillIds = Array.isArray(value?.skillIds)
    ? [...new Set(value.skillIds.filter((skillId): skillId is string => typeof skillId === "string" && skillId.length > 0))]
    : [];
  if (!name || name.length > 120) return null;
  if (!isValidCollectionSlug(slug)) return null;
  if (description.length > 500) return null;
  if (!skillIds.length || skillIds.length > 100) return null;
  return {name, slug, description, skillIds};
}

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const input = cleanBody(body);
  if (!input) return NextResponse.json({error: "invalid_collection"}, {status: 400});

  const {data: updated, error: collectionError} = await supabase.rpc("replace_skill_collection", {
    p_collection_id: id,
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description,
    p_skill_ids: input.skillIds,
  });

  if (collectionError) {
    if (collectionError.code === "23505") return NextResponse.json({error: "collection_duplicate"}, {status: 409});
    return NextResponse.json({error: "collection_update_failed"}, {status: 500});
  }
  if (updated !== true) return NextResponse.json({error: "collection_not_found"}, {status: 404});
  const collections = await getUserSkillCollections();
  return NextResponse.json({collections: collections ?? []}, {headers: {"Cache-Control": "no-store"}});
}

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  const {data: ownedCollection, error: lookupError} = await supabase
    .from("skill_collections")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({error: "collection_delete_failed"}, {status: 500});

  const {error} = ownedCollection ? await supabase
    .from("skill_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId) : await supabase
    .from("user_collection_library")
    .delete()
    .eq("collection_id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({error: "collection_delete_failed"}, {status: 500});
  const collections = await getUserSkillCollections();
  return NextResponse.json({collections: collections ?? []}, {headers: {"Cache-Control": "no-store"}});
}
