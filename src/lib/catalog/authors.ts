import "server-only";
import {featuredCreators, getFeaturedCreator} from "@/data/mockData";
import {listPublicSkills, type SkillSummary} from "@/lib/catalog/skills";

export type AuthorProfile = Readonly<{
  id: string;
  initials: string;
  name: string;
  handle: string;
  icon: string;
  domain: string;
  glowClass: string;
  bio: string;
  focus: readonly string[];
}>;

const authorDetails: Readonly<Record<string, Pick<AuthorProfile, "bio" | "focus">>> = {
  "ocean-labs": {
    bio: "Builds production-ready agent skills for design, research, and automation teams that need predictable workflows.",
    focus: ["Design systems", "MCP workflows", "Agent handoffs"],
  },
  "agent-ops": {
    bio: "A guild of agent operators focused on safe automation, observability, and repeatable AI execution patterns.",
    focus: ["Agent operations", "Reliability", "Security"],
  },
  "growth-systems": {
    bio: "Creates growth and revenue skills for teams that want sharper market research, content, and lifecycle workflows.",
    focus: ["Growth loops", "Messaging", "Revenue operations"],
  },
  "neural-systems": {
    bio: "Architects high-performance AI skills for next-generation automation and natural language processing workflows.",
    focus: ["NLP", "Developer tooling", "Workflow automation"],
  },
};

export function getAuthorProfile(id: string): AuthorProfile | null {
  const creator = getFeaturedCreator(id);
  if (!creator) return null;
  const details = authorDetails[id];
  return {
    ...creator,
    bio: details?.bio ?? "Verified OceanSkill creator publishing reliable AI skills for agent workflows.",
    focus: details?.focus ?? [creator.domain, "OceanSkill", "MCP"],
  };
}

export function getSkillAuthor(skill: SkillSummary): AuthorProfile {
  const creator =
    featuredCreators.find((item) => item.domain === skill.domain) ??
    getFeaturedCreator("neural-systems") ??
    featuredCreators[0];
  return getAuthorProfile(creator.id) ?? {
    ...creator,
    bio: "Verified OceanSkill creator publishing reliable AI skills for agent workflows.",
    focus: [creator.domain, "OceanSkill", "MCP"],
  };
}

export async function listAuthorSkills(authorId: string) {
  const author = getAuthorProfile(authorId);
  if (!author) return null;
  const skills = await listPublicSkills();
  const byDomain = skills.filter((skill) => skill.domain === author.domain);
  return {author, skills: byDomain.length ? byDomain : skills};
}
