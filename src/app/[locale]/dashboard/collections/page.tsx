import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import DashboardCollections from "@/components/dashboard/DashboardCollections";
import {getCreatorSkills, getUserSkillLibrary} from "@/lib/skills/creator";
import {getUserSkillCollections} from "@/lib/skills/collections";

export const dynamic = "force-dynamic";

export default async function DashboardCollectionsPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, creatorData, library, collections] = await Promise.all([
    getTranslations("Dashboard"),
    getCreatorSkills(),
    getUserSkillLibrary(locale),
    getUserSkillCollections(),
  ]);

  if (!creatorData || !library || !collections) redirect(`/${locale}/login`);

  return (
    <>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("collectionsEyebrow")}</p>
          <h1 className="mt-3 font-geist text-5xl font-bold tracking-tight">{t("collections")}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("collectionsDescription")}</p>
        </div>
      </header>

      <DashboardCollections
        library={library}
        uploaded={creatorData.skills}
        locale={locale}
        initialCollections={collections}
        labels={{
          addNew: t("collectionAddNew"),
          addHint: t("collectionAddHint"),
          createTitle: t("collectionCreateTitle"),
          namePlaceholder: t("collectionNamePlaceholder"),
          slugPlaceholder: t("collectionSlugPlaceholder"),
          slugHint: t("collectionSlugHint"),
          descriptionPlaceholder: t("collectionDescriptionPlaceholder"),
          searchPlaceholder: t("collectionSearchPlaceholder"),
          emptySkills: t("collectionEmptySkills"),
          creating: t("collectionCreating"),
          create: t("collectionCreate"),
          library: t("collectionSkillLibrary"),
          uploaded: t("collectionSkillUploaded"),
          suggested: t("collectionSuggested"),
          open: t("collectionOpen"),
          delete: t("collectionDelete"),
          skillCount: t("collectionSkillCount"),
          duplicateError: t("collectionDuplicateError"),
          defaultDescription: t("collectionDefaultDescription"),
          starterMarketing: t("collectionStarterMarketing"),
          starterDevelopment: t("collectionStarterDevelopment"),
          starterSet: t("collectionStarterSet"),
          close: t("collectionClose"),
          platformBadge: t("collectionPlatformBadge"),
          platformTitle: t("collectionPlatformTitle"),
          platformDescription: t("collectionPlatformDescription"),
          platformAdd: t("collectionPlatformAdd"),
          platformAdded: t("collectionPlatformAdded"),
          readOnly: t("collectionReadOnly"),
          personalTitle: t("collectionPersonalTitle"),
          personalDescription: t("collectionPersonalDescription"),
          tabAll: t("collectionTabAll"),
          tabPlatform: t("collectionTabPlatform"),
          tabPersonal: t("collectionTabPersonal"),
          emptyPlatform: t("collectionEmptyPlatform"),
          emptyPersonal: t("collectionEmptyPersonal"),
        }}
      />
    </>
  );
}
