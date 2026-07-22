import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import type {PlatformAuthor} from "@/lib/skills/platform-author-schema";

export async function listPlatformAuthors(): Promise<PlatformAuthor[]> {
  const admin = createAdminClient();
  const [{data: authors, error}, {data: translations, error: translationError}, {data: skills, error: skillsError}] = await Promise.all([
    admin.from("authors").select("id,name,handle,icon,category,glow_class,website_url,avatar_url,verified,created_at,updated_at").order("updated_at", {ascending: false}),
    admin.from("author_translations").select("author_id,locale,bio,focus").in("locale", ["en", "vi"]),
    admin.from("skills").select("author_id").not("author_id", "is", null),
  ]);
  if (error || translationError || skillsError) throw (error ?? translationError ?? skillsError);

  const translationMap = new Map((translations ?? []).map((row) => [`${row.author_id}:${row.locale}`, row]));
  const counts = new Map<string, number>();
  for (const skill of skills ?? []) {
    if (skill.author_id) counts.set(skill.author_id, (counts.get(skill.author_id) ?? 0) + 1);
  }
  return (authors ?? []).map((author) => {
    const en = translationMap.get(`${author.id}:en`);
    const vi = translationMap.get(`${author.id}:vi`);
    return {
      ...author,
      bio_en: en?.bio ?? "",
      focus_en: en?.focus ?? [],
      bio_vi: vi?.bio ?? "",
      focus_vi: vi?.focus ?? [],
      skill_count: counts.get(author.id) ?? 0,
    };
  }) as PlatformAuthor[];
}
