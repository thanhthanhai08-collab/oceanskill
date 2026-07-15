import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getUserSkillCollections} from "@/lib/skills/collections";
import {isValidCollectionSlug, slugifyCollectionName} from "@/lib/skills/collectionSlug";

type CollectionBody = Readonly<{name?: unknown; slug?: unknown; description?: unknown; skillIds?: unknown}>;
const accents = ["primary", "secondary", "tertiary"] as const;

function cleanBody(input: unknown) {
  const value = input as CollectionBody;
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  const rawSlug = typeof value?.slug === "string" ? value.slug.trim() : "";
  const slug = rawSlug ? slugifyCollectionName(rawSlug) : slugifyCollectionName(name);
  const description = typeof value?.description === "string" ? value.description.trim() : "";
  const skillIds = Array.isArray(value?.skillIds)
    ? [...new Set(value.skillIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  if (!name || name.length > 120) return null;
  if (!isValidCollectionSlug(slug)) return null;
  if (description.length > 500) return null;
  if (!skillIds.length || skillIds.length > 100) return null;
  return {name, slug, description, skillIds};
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

  const {data: collectionId, error: collectionError} = await supabase.rpc("create_skill_collection", {
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description,
    p_accent: accents[(count ?? 0) % accents.length],
    p_skill_ids: input.skillIds,
  });

  if (collectionError || !collectionId) {
    if (collectionError?.code === "23505") return NextResponse.json({error: "collection_duplicate"}, {status: 409});
    return NextResponse.json({error: "collection_create_failed"}, {status: 500});
  }

  const collections = await getUserSkillCollections();
  const locale = request.headers.get("referer")?.match(/\/(vi|en)\//)?.[1] ?? "vi";
  return NextResponse.json({collections: collections ?? [], collectionId, href: `/${locale}/dashboard/collections/${input.slug}`}, {headers: {"Cache-Control": "no-store"}});
}
