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
}>;

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: "primary" | "secondary" | "tertiary";
  updated_at: string;
  user_id: string;
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
    .select("added_at,skill_collections!inner(id,user_id,slug,name,description,accent,updated_at,skill_collection_items(skill_id,position))")
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
    skillIds: [...(row.skill_collection_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.skill_id),
    }];
  }) as SkillCollection[];
}

export async function getUserSkillCollectionBySlug(slug: string) {
  const collections = await getUserSkillCollections();
  if (!collections) return null;
  return collections.find((collection) => collection.slug === slug) ?? null;
}
