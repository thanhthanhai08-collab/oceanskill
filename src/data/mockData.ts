export type DomainVisual = Readonly<{
  icon: string;
  accentClass: string;
  glowClass: string;
}>;

export const domainVisuals: Readonly<Record<string, DomainVisual>> = {
  "agent-first": {icon: "neurology", accentClass: "text-primary", glowClass: "from-primary-container/70 via-secondary-container/35 to-tertiary/20"},
  security: {icon: "shield_lock", accentClass: "text-secondary", glowClass: "from-secondary-container/70 via-primary-container/35 to-error/20"},
  productivity: {icon: "bolt", accentClass: "text-tertiary", glowClass: "from-tertiary-container/70 via-primary-container/35 to-secondary/20"},
  design: {icon: "palette", accentClass: "text-secondary", glowClass: "from-secondary-container/65 via-tertiary-container/30 to-primary-container/30"},
  marketing: {icon: "campaign", accentClass: "text-primary", glowClass: "from-primary-container/65 via-secondary-container/30 to-tertiary-container/30"},
  development: {icon: "terminal", accentClass: "text-tertiary", glowClass: "from-tertiary-container/65 via-primary-container/35 to-secondary-container/25"},
  research: {icon: "experiment", accentClass: "text-secondary", glowClass: "from-secondary-container/60 via-primary-container/30 to-tertiary-container/30"},
};

export const fallbackDomainVisual: DomainVisual = {
  icon: "auto_awesome",
  accentClass: "text-primary",
  glowClass: "from-primary-container/60 via-secondary-container/30 to-tertiary-container/25",
};

export const navItems = [
  {href: "/skills", label: "marketplace"},
  {href: "/leaderboard", label: "leaderboard"},
  {href: "/blog", label: "blog"},
  {href: "/docs", label: "docs"},
  {href: "/faq", label: "faq"},
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

export const homeCategoryFilters = ["all", "marketing", "sales", "agent-first"] as const;
export type HomeCategoryFilter = (typeof homeCategoryFilters)[number];

export const featuredCreators = [
  {id: "ocean-labs", initials: "OL", name: "Ocean Labs", handle: "@oceanlabs", icon: "water", glowClass: "from-primary-container via-tertiary-container to-surface-container-high"},
  {id: "agent-ops", initials: "AO", name: "AgentOps Guild", handle: "@agentops", icon: "neurology", glowClass: "from-secondary-container via-primary-container to-surface-container-high"},
  {id: "growth-systems", initials: "GS", name: "Growth Systems", handle: "@growthsystems", icon: "monitoring", glowClass: "from-tertiary-container via-primary-container to-surface-container-high"},
] as const;

export const hotCollections = [
  {id: "agent-starter", icon: "rocket_launch", glowClass: "from-primary-container/70 via-secondary-container/35 to-background"},
  {id: "growth-engine", icon: "campaign", glowClass: "from-secondary-container/70 via-primary-container/35 to-background"},
  {id: "revenue-ops", icon: "payments", glowClass: "from-tertiary-container/70 via-primary-container/35 to-background"},
] as const;

export function getDomainVisual(domain: string): DomainVisual {
  return domainVisuals[domain] ?? fallbackDomainVisual;
}
