import type {SkillSummary} from "@/lib/catalog/skills";

const garryTan = {
  id: "garry-tan",
  name: "Garry Tan",
  handle: "@garrytan",
  icon: "rocket_launch",
  category: "ai-agent",
  glow_class: "from-primary-container via-secondary-container to-surface-container-high",
  bio: "Founder, investor, and builder behind gstack, an opinionated workflow for AI-assisted engineering teams.",
  focus: ["gstack", "Engineering workflow", "AI agents"],
  website_url: "https://github.com/garrytan/gstack",
  avatar_path: null,
  avatar_url: null,
};

const googleLabs = {
  id: "google-labs",
  name: "Google Labs",
  handle: "@googlelabs",
  icon: "palette",
  category: "design",
  glow_class: "from-secondary-container via-tertiary-container to-surface-container-high",
  bio: "Google Labs publishes Stitch skills for generating designs, extracting design systems, and building UI workflows for agent clients.",
  focus: ["Stitch", "Design systems", "UI generation"],
  website_url: "https://github.com/google-labs-code/stitch-skills",
  avatar_path: null,
  avatar_url: null,
};

export const platformSkillFallbacks: SkillSummary[] = [
  {id: "00000000-0000-4000-8000-000000000101", slug: "gstack-engineering-workflow", title: "gstack by Garry Tan", description: "An opinionated AI engineering workflow covering product discovery, planning, design, review, QA, security, documentation, and shipping.", category: "ai-agent", compatible_clients: ["Codex", "Claude Code", "Cursor"], license_spdx: "MIT", source_url: "https://github.com/garrytan/gstack", current_version: "1.58.5.0", updated_at: "2026-07-02T00:00:00.000Z", author_id: "garry-tan", authors: garryTan},
  {id: "00000000-0000-4000-8000-000000000102", slug: "google-stitch-design-skills", title: "Stitch Skills by Google Labs", description: "A collection of Agent Skills for generating Stitch designs, extracting design systems, building interfaces, and producing supporting assets.", category: "design", compatible_clients: ["Codex", "Antigravity", "Gemini CLI", "Claude Code", "Cursor"], license_spdx: "Apache-2.0", source_url: "https://github.com/google-labs-code/stitch-skills", current_version: "1.0.0", updated_at: "2026-07-02T00:00:00.000Z", author_id: "google-labs", authors: googleLabs}
];
