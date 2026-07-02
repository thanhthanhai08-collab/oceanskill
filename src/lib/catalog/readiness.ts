import type {SkillSummary} from "@/lib/catalog/skills";

export type RankedSkill = SkillSummary & Readonly<{readinessScore: number}>;

export function rankSkillsByReadiness(skills: SkillSummary[]): RankedSkill[] {
  return skills
    .map((skill) => ({
      ...skill,
      readinessScore: Math.min(100, 55 + skill.compatible_clients.length * 10 + (skill.current_version ? 10 : 0) + (skill.license_spdx ? 5 : 0)),
    }))
    .sort((a, b) => b.readinessScore - a.readinessScore || a.title.localeCompare(b.title));
}
