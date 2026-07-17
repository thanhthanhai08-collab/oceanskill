import "server-only";
import {createClient} from "@/lib/supabase/server";

export type SkillCollection = Readonly<{
  id: string;
  slug: string;
  name: string;
  description: string;
  skillIds: string[];
  accent: "primary" | "secondary" | "tertiary";
  updatedAt: string;
  owned: boolean;
  collectionType: "user" | "platform";
  added?: boolean;
}>;

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: "primary" | "secondary" | "tertiary";
  updated_at: string;
  user_id: string | null;
  collection_type: "user" | "platform";
  skill_collection_items?: Array<{skill_id: string; position: number}> | null;
};

type LibraryRow = Readonly<{
  added_at: string;
  skill_collections: CollectionRow | CollectionRow[] | null;
}>;

export async function getUserSkillCollections() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const {data, error} = await supabase
    .from("user_collection_library")
    .select("added_at,skill_collections!inner(id,user_id,collection_type,slug,name,description,accent,updated_at,skill_collection_items(skill_id,position))")
    .eq("user_id", String(userId))
    .order("added_at", {ascending: false});

  if (error) throw new Error(`Could not load skill collections: ${error.message}`);

  return ((data ?? []) as unknown as LibraryRow[]).flatMap((libraryRow) => {
    const row = Array.isArray(libraryRow.skill_collections) ? libraryRow.skill_collections[0] : libraryRow.skill_collections;
    if (!row) return [];
    return [{
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    accent: row.accent,
    updatedAt: row.updated_at,
    owned: row.user_id === String(userId),
    collectionType: row.collection_type,
    added: true,
    skillIds: [...(row.skill_collection_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.skill_id),
    }];
  }) as SkillCollection[];
}

export async function getPlatformSkillCollections(locale: string) {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const [{data, error}, {data: library, error: libraryError}] = await Promise.all([
    supabase.from("skill_collections")
      .select("id,user_id,collection_type,slug,name,description,accent,updated_at,skill_collection_items(skill_id,position),skill_collection_translations(locale,name,description)")
      .eq("collection_type", "platform").eq("skill_collection_translations.locale", locale).order("updated_at", {ascending: false}),
    supabase.from("user_collection_library").select("collection_id").eq("user_id", String(userId)),
  ]);
  if (error || libraryError) throw new Error(`Could not load platform collections: ${(error ?? libraryError)?.message}`);
  const addedIds = new Set((library ?? []).map((row) => row.collection_id));
  return (data ?? []).map((row) => {
    const relations = row.skill_collection_translations as unknown as Array<{locale: string; name: string; description: string}> | null;
    const translation = relations?.[0];
    return {
      id: row.id, slug: row.slug, name: translation?.name ?? row.name, description: translation?.description ?? row.description,
      accent: row.accent, updatedAt: row.updated_at, owned: false, collectionType: "platform" as const, added: addedIds.has(row.id),
      skillIds: [...(row.skill_collection_items ?? [])].sort((a, b) => a.position - b.position).map((item) => item.skill_id),
    };
  }) as SkillCollection[];
}

export async function getUserSkillCollectionBySlug(slug: string) {
  const collections = await getUserSkillCollections();
  if (!collections) return null;
  return collections.find((collection) => collection.slug === slug) ?? null;
}
