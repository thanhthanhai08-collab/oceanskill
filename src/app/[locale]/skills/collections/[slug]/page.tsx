import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import SkillCard from "@/components/skills/SkillCard";
import AddPlatformCollectionButton from "@/components/skills/AddPlatformCollectionButton";
import {listPublicSkills} from "@/lib/catalog/skills";
import type {SkillSummary} from "@/lib/catalog/skills";
import {getPlatformSkillCollectionBySlug, type SkillCollection} from "@/lib/skills/collections";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {getCollectionDraft} from "@/lib/admin/content";

export const dynamic = "force-dynamic";

type PlatformCollectionPageProps = Readonly<{params: Promise<{locale: string; slug: string}>; searchParams: Promise<{preview?: string}>}>;

export async function generateMetadata({searchParams}: Pick<PlatformCollectionPageProps, "searchParams">): Promise<Metadata> {
  return (await searchParams).preview ? {robots: {index: false, follow: false}} : {};
}

export default async function PlatformCollectionPage({params, searchParams}: PlatformCollectionPageProps) {
  const {locale, slug} = await params;
  const previewId = (await searchParams).preview;
  let collection: SkillCollection | null;
  if (previewId) {
    if (!await getPlatformAdmin()) notFound();
    const draft = await getCollectionDraft(previewId);
    if (!draft || draft.status !== "review" || draft.slug !== slug) notFound();
    collection = {id: draft.collection_id ?? draft.id, slug: draft.slug, name: locale === "vi" ? draft.name_vi : draft.name_en, description: locale === "vi" ? draft.description_vi : draft.description_en, skillIds: draft.skill_ids, accent: draft.accent, updatedAt: draft.updated_at, owned: false, collectionType: "platform", added: false};
  } else {
    collection = await getPlatformSkillCollectionBySlug(locale, slug);
  }
  const [skills, t] = await Promise.all([listPublicSkills(locale), getTranslations("Marketplace")]);
  if (!collection) notFound();
  const isPreview = Boolean(previewId);
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const collectionSkills = collection.skillIds.map((id) => byId.get(id)).filter((skill): skill is SkillSummary => Boolean(skill));

  return <><div className="min-w-0">
    {isPreview && <div className="sticky top-20 z-40 mb-4 flex items-center justify-between gap-4 rounded-2xl border border-secondary/30 bg-background/95 px-4 py-3 shadow-lg backdrop-blur"><Link href="/admin/collections" className="text-sm font-semibold text-primary">← {locale === "vi" ? "Quay lại quản trị" : "Back to admin"}</Link><span className="rounded-full bg-secondary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary">Preview · noindex · read only</span></div>}
    <div className={isPreview ? "pointer-events-none" : ""}>
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
    </div>
  </div></>;
}
