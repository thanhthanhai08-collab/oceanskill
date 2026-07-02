import {listPublicSkills} from "@/lib/catalog/skills";
import {getSiteUrl, localizedUrl} from "@/lib/seo/site";
import {getBlogPosts} from "@/content/blog";

export const revalidate = 3600;

export async function GET() {
  let skills: Awaited<ReturnType<typeof listPublicSkills>> = [];
  try { skills = await listPublicSkills(); } catch { /* Keep the core guide available. */ }
  const lines = [
    "# OceanSkill",
    "",
    "> OceanSkill is a curated marketplace for reviewed, production-ready AI agent skills. Public pages expose evaluation metadata; protected SKILL.md content is delivered only through authenticated MCP calls.",
    "",
    "## Canonical pages",
    `- Vietnamese home: ${localizedUrl("vi")}`,
    `- English home: ${localizedUrl("en")}`,
    `- Marketplace: ${localizedUrl("en", "skills")}`,
    `- Readiness rankings: ${localizedUrl("en", "leaderboard")}`,
    `- Documentation: ${localizedUrl("en", "docs")}`,
    `- Blog: ${localizedUrl("en", "blog")}`,
    `- FAQ and OceanGuide: ${localizedUrl("en", "faq")}`,
    "",
    "## Public skill catalog",
    ...skills.map((skill) => `- [${skill.title}](${localizedUrl("en", `skills/${skill.slug}`)}): ${skill.description}`),
    "",
    "## Guides and explanations",
    ...getBlogPosts("en").map((post) => `- [${post.title}](${localizedUrl("en", `blog/${post.slug}`)}): ${post.excerpt}`),
    "",
    "## Trust and access model",
    "- Authentication: Supabase Auth with server-validated JWT claims.",
    "- Authorization: Postgres Row Level Security for user-owned keys, credits, orders, and usage.",
    "- Protected content: never embedded in public pages or this file.",
    "",
    `Source: ${getSiteUrl()}`,
  ];
  return new Response(lines.join("\n"), {headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"}});
}
