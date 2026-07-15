import {getTranslations} from "next-intl/server";
import {notFound, redirect} from "next/navigation";
import DashboardCollectionDetail from "@/components/dashboard/DashboardCollectionDetail";
import {getCreatorSkills, getUserSkillLibrary} from "@/lib/skills/creator";
import {getUserSkillCollectionBySlug} from "@/lib/skills/collections";

export const dynamic = "force-dynamic";

export default async function DashboardCollectionDetailPage({params}: {readonly params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const [t, creatorData, library, collection] = await Promise.all([
    getTranslations("Dashboard"),
    getCreatorSkills(),
    getUserSkillLibrary(locale),
    getUserSkillCollectionBySlug(slug),
  ]);

  if (!creatorData || !library) redirect(`/${locale}/login`);
  if (!collection) notFound();

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("collectionDetailEyebrow")}</p>
        <h1 className="mt-3 font-geist text-5xl font-bold tracking-tight">{collection.name}</h1>
        <p className="mt-4 max-w-3xl font-mono text-sm text-on-surface-variant">{collection.slug}</p>
      </header>

      <DashboardCollectionDetail
        collection={collection}
        library={library}
        uploaded={creatorData.skills}
        labels={{
          name: t("collectionNameLabel"),
          key: t("collectionKeyLabel"),
          keyHint: t("collectionSlugHint"),
          keyWarning: t("collectionKeyWarning"),
          description: t("collectionDescriptionLabel"),
          search: t("collectionSearchPlaceholder"),
          library: t("collectionSkillLibrary"),
          uploaded: t("collectionSkillUploaded"),
          emptySkills: t("collectionEmptySkills"),
          save: t("collectionSave"),
          saving: t("collectionSaving"),
          saveFailed: t("collectionSaveFailed"),
        }}
      />
    </>
  );
}
