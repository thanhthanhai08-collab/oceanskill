export type CategoryVisual = Readonly<{
  icon: string;
  accentClass: string;
  glowClass: string;
}>;

export const categoryVisuals: Readonly<Record<string, CategoryVisual>> = {
  "ai-agent": {icon: "neurology", accentClass: "text-primary", glowClass: "from-primary-container/70 via-secondary-container/35 to-tertiary/20"},
  security: {icon: "shield_lock", accentClass: "text-secondary", glowClass: "from-secondary-container/70 via-primary-container/35 to-error/20"},
  productivity: {icon: "bolt", accentClass: "text-tertiary", glowClass: "from-tertiary-container/70 via-primary-container/35 to-secondary/20"},
  design: {icon: "palette", accentClass: "text-secondary", glowClass: "from-secondary-container/65 via-tertiary-container/30 to-primary-container/30"},
  marketing: {icon: "campaign", accentClass: "text-primary", glowClass: "from-primary-container/65 via-secondary-container/30 to-tertiary-container/30"},
  development: {icon: "terminal", accentClass: "text-tertiary", glowClass: "from-tertiary-container/65 via-primary-container/35 to-secondary-container/25"},
  research: {icon: "experiment", accentClass: "text-secondary", glowClass: "from-secondary-container/60 via-primary-container/30 to-tertiary-container/30"},
};

export const fallbackCategoryVisual: CategoryVisual = {
  icon: "auto_awesome",
  accentClass: "text-primary",
  glowClass: "from-primary-container/60 via-secondary-container/30 to-tertiary-container/25",
};

export const navItems = [
  {href: "/skills", label: "marketplace"},
  {href: "/leaderboard", label: "leaderboard"},
  {href: "/pricing", label: "pricing"},
  {href: "/blog", label: "blog"},
  {href: "/document", label: "docs"},
] as const;

export const dashboardNavItems = [
  {icon: "dashboard", label: "overview", href: "/dashboard"},
  {icon: "smart_toy", label: "skills", href: "/dashboard/skills"},
  {icon: "folder_special", label: "collections", href: "/dashboard/collections"},
  {icon: "vpn_key", label: "mcpKeys", href: "/dashboard/mcp-keys"},
  {icon: "insights", label: "usage", href: "/dashboard/usage"},
  {icon: "payments", label: "billing", href: "/dashboard/billing"},
  {icon: "settings", label: "settings", href: "/dashboard/settings"},
] as const;

export const homeCategoryFilters = ["all", "marketing", "sales", "ai-agent"] as const;
export type HomeCategoryFilter = (typeof homeCategoryFilters)[number];

export const featuredCreators = [
  {id: "ocean-labs", initials: "OL", name: "Ocean Labs", handle: "@oceanlabs", icon: "water", category: "design", glowClass: "from-primary-container via-tertiary-container to-surface-container-high"},
  {id: "agent-ops", initials: "AO", name: "AgentOps Guild", handle: "@agentops", icon: "neurology", category: "ai-agent", glowClass: "from-secondary-container via-primary-container to-surface-container-high"},
  {id: "growth-systems", initials: "GS", name: "Growth Systems", handle: "@growthsystems", icon: "monitoring", category: "marketing", glowClass: "from-tertiary-container via-primary-container to-surface-container-high"},
  {id: "neural-systems", initials: "NS", name: "NeuralSystems", handle: "@neuralsystems", icon: "hub", category: "development", glowClass: "from-primary-container via-secondary-container to-surface-container-high"},
] as const;

export type FeaturedCreator = (typeof featuredCreators)[number];

export function getFeaturedCreator(id: string): FeaturedCreator | undefined {
  return featuredCreators.find((creator) => creator.id === id);
}

export const hotCollections = [
  {id: "agent-starter", icon: "rocket_launch", glowClass: "from-primary-container/70 via-secondary-container/35 to-background"},
  {id: "growth-engine", icon: "campaign", glowClass: "from-secondary-container/70 via-primary-container/35 to-background"},
  {id: "revenue-ops", icon: "payments", glowClass: "from-tertiary-container/70 via-primary-container/35 to-background"},
] as const;

export function getCategoryVisual(category: string): CategoryVisual {
  return categoryVisuals[category] ?? fallbackCategoryVisual;
}
