import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import SkillCard from "@/components/skills/SkillCard";
import AddPlatformCollectionButton from "@/components/skills/AddPlatformCollectionButton";
import {listPublicSkills} from "@/lib/catalog/skills";
import type {SkillSummary} from "@/lib/catalog/skills";
import {getPlatformSkillCollectionBySlug} from "@/lib/skills/collections";

export const dynamic = "force-dynamic";

export default async function PlatformCollectionPage({params}: {readonly params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const [collection, skills, t] = await Promise.all([
    getPlatformSkillCollectionBySlug(locale, slug),
    listPublicSkills(locale),
    getTranslations("Marketplace"),
  ]);
  if (!collection) notFound();
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const collectionSkills = collection.skillIds.map((id) => byId.get(id)).filter((skill): skill is SkillSummary => Boolean(skill));

  return <div className="min-w-0">
    <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-container-low to-background p-7 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t("collectionEyebrow")}</p>
          <h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{collection.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">{collection.description}</p>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-on-surface-variant">{t("collectionSkillCount", {count: collectionSkills.length})}</p>
        </div>
        <AddPlatformCollectionButton collectionId={collection.id} collectionSlug={collection.slug} locale={locale} initialAdded={Boolean(collection.added)} labels={{add: t("collectionAdd"), added: t("collectionAdded"), failed: t("collectionAddFailed")}} />
      </div>
    </section>
    <section className="mt-10">
      <h2 className="font-geist text-2xl font-bold">{t("collectionIncluded")}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collectionSkills.map((skill) => <SkillCard key={skill.id} skill={skill} actionLabel={t("viewSkill")} />)}
      </div>
    </section>
  </div>;
}
