import type {SkillSummary} from "@/lib/catalog/skills";

export const platformSkillFallbacks: SkillSummary[] = [
  {id: "00000000-0000-4000-8000-000000000101", slug: "gstack-engineering-workflow", title: "gstack by Garry Tan", description: "An opinionated AI engineering workflow covering product discovery, planning, design, review, QA, security, documentation, and shipping.", domain: "agent-first", compatible_clients: ["Codex", "Claude Code", "Cursor"], license_spdx: "MIT", source_url: "https://github.com/garrytan/gstack", current_version: "1.58.5.0", updated_at: "2026-07-02T00:00:00.000Z"},
  {id: "00000000-0000-4000-8000-000000000102", slug: "google-stitch-design-skills", title: "Stitch Skills by Google Labs", description: "A collection of Agent Skills for generating Stitch designs, extracting design systems, building interfaces, and producing supporting assets.", domain: "design", compatible_clients: ["Codex", "Antigravity", "Gemini CLI", "Claude Code", "Cursor"], license_spdx: "Apache-2.0", source_url: "https://github.com/google-labs-code/stitch-skills", current_version: "1.0.0", updated_at: "2026-07-02T00:00:00.000Z"}
];
