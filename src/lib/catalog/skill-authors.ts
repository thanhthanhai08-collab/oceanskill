import type {SkillSummary} from "@/lib/catalog/skills";

const authorByDomain: Record<string, string> = {
  "agent-first": "AgentOps Guild",
  security: "AgentOps Guild",
  design: "Ocean Labs",
  marketing: "Growth Systems",
  development: "NeuralSystems",
  productivity: "Ocean Labs",
  research: "Ocean Labs",
};

export function getSkillAuthorName(skill: Pick<SkillSummary, "slug" | "title" | "domain">) {
  const signature = `${skill.slug} ${skill.title}`.toLocaleLowerCase();
  if (signature.includes("google") || signature.includes("stitch")) return "Google Labs";
  if (signature.includes("gstack") || signature.includes("garry")) return "Garry Tan";
  return authorByDomain[skill.domain] ?? "OceanSkill Creator";
}
