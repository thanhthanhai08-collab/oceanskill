export const authorCategories = ["ai-agent", "security", "productivity", "design", "marketing", "development", "research"] as const;
export const authorGlowClasses = [
  "from-primary-container via-secondary-container to-surface-container-high",
  "from-secondary-container via-tertiary-container to-surface-container-high",
  "from-tertiary-container via-primary-container to-surface-container-high",
] as const;

export type PlatformAuthor = Readonly<{
  id: string;
  name: string;
  handle: string;
  icon: string;
  category: string;
  glow_class: string;
  website_url: string | null;
  avatar_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  bio_en: string;
  focus_en: string[];
  bio_vi: string;
  focus_vi: string[];
  skill_count: number;
}>;
