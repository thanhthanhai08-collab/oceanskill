import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {listPublicSkills, type SkillAuthor, type SkillSummary} from "@/lib/catalog/skills";

export type AuthorProfile = SkillAuthor & Readonly<{verified: boolean}>;

type AuthorTranslation = Readonly<{
  author_id: string;
  locale: string;
  bio: string;
  focus: string[];
}>;

const fields = "id,name,handle,icon,category,glow_class,bio,focus,website_url,verified,avatar_path,avatar_url";

export function getSkillAuthor(skill: SkillSummary): AuthorProfile {
  if (skill.authors) return {...skill.authors, verified: true};
  return {
    id: "unknown",
    name: "OceanSkill Creator",
    handle: "",
    icon: "person",
    category: skill.category,
    glow_class: "from-primary-container via-secondary-container to-surface-container-high",
    bio: "Verified OceanSkill creator publishing reliable AI skills for agent workflows.",
    focus: [skill.category, "OceanSkill", "MCP"],
    website_url: null,
    avatar_path: null,
    avatar_url: null,
    verified: true,
  };
}

export async function getAuthorProfile(id: string, locale?: string): Promise<AuthorProfile | null> {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("authors").select(fields).eq("id", id).eq("verified", true).maybeSingle();
  if (error) throw new Error(`Could not load author: ${error.message}`);
  const author = (data as AuthorProfile | null) ?? null;
  if (!author || !locale) return author;

  const locales = locale === "en" ? ["en"] : [locale, "en"];
  const {data: translations, error: translationError} = await supabase
    .from("author_translations")
    .select("author_id,locale,bio,focus")
    .eq("author_id", id)
    .in("locale", locales);
  if (translationError) return author;

  const rows = (translations ?? []) as AuthorTranslation[];
  const translation = rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en");
  return translation ? {...author, bio: translation.bio, focus: translation.focus} : author;
}

export async function listAuthorSkills(authorId: string, locale?: string) {
  const [author, skills] = await Promise.all([getAuthorProfile(authorId, locale), listPublicSkills(locale)]);
  if (!author) return null;
  return {author, skills: skills.filter((skill) => skill.author_id === author.id)};
}
