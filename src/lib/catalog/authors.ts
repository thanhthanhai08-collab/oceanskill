import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {listPublicSkills, type SkillAuthor, type SkillSummary} from "@/lib/catalog/skills";

export type AuthorProfile = SkillAuthor & Readonly<{verified: boolean}>;

const fields = "id,name,handle,icon,domain,glow_class,bio,focus,website_url,verified,avatar_path,avatar_url";

export function getSkillAuthor(skill: SkillSummary): AuthorProfile {
  if (skill.authors) return {...skill.authors, verified: true};
  return {
    id: "unknown",
    name: "OceanSkill Creator",
    handle: "",
    icon: "person",
    domain: skill.domain,
    glow_class: "from-primary-container via-secondary-container to-surface-container-high",
    bio: "Verified OceanSkill creator publishing reliable AI skills for agent workflows.",
    focus: [skill.domain, "OceanSkill", "MCP"],
    website_url: null,
    avatar_path: null,
    avatar_url: null,
    verified: true,
  };
}

export async function getAuthorProfile(id: string): Promise<AuthorProfile | null> {
  const supabase = createPublicClient();
  const {data, error} = await supabase.from("authors").select(fields).eq("id", id).eq("verified", true).maybeSingle();
  if (error) throw new Error(`Could not load author: ${error.message}`);
  return (data as AuthorProfile | null) ?? null;
}

export async function listAuthorSkills(authorId: string) {
  const [author, skills] = await Promise.all([getAuthorProfile(authorId), listPublicSkills()]);
  if (!author) return null;
  return {author, skills: skills.filter((skill) => skill.author_id === author.id)};
}
