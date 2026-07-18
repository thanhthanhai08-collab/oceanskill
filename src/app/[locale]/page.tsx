import SiteShell from "@/components/layout/SiteShell";
import HomeHero from "@/components/home/HomeHero";
import HomeSkillExplorer from "@/components/home/HomeSkillExplorer";
import FeaturedCreators from "@/components/home/FeaturedCreators";
import HotCollections from "@/components/home/HotCollections";
import McpSpotlight from "@/components/home/McpSpotlight";
import KnowledgeHub from "@/components/home/KnowledgeHub";
import AboutSection from "@/components/home/AboutSection";
import {listPublicSkills} from "@/lib/catalog/skills";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import {getTranslations} from "next-intl/server";
import {getPlatformSkillCollections} from "@/lib/skills/collections";

export const dynamic = "force-dynamic";

export default async function HomePage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [skills, platformCollections, t] = await Promise.all([listPublicSkills(locale), getPlatformSkillCollections(locale), getTranslations("Home")]);
  return (
    <SiteShell>
      <HomeStructuredData />
      <HomeHero />
      <HomeSkillExplorer skills={skills} labels={{eyebrow: t("featuredEyebrow"), title: t("featuredTitle"), subtitle: t("featuredSubtitle"), viewAll: t("viewAll"), viewSkill: t("viewSkill"), empty: t("filterEmpty"), categories: {all: t("filters.all"), marketing: t("filters.marketing"), sales: t("filters.sales"), "ai-agent": t("filters.ai-agent")}}} />
      <FeaturedCreators />
      <HotCollections collections={platformCollections} />
      <KnowledgeHub />
      <McpSpotlight />
      <AboutSection skillCount={skills.length} />
    </SiteShell>
  );
}
