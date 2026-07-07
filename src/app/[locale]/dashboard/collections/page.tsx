import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import DashboardCollections from "@/components/dashboard/DashboardCollections";
import {getCreatorSkills, getUserSkillLibrary} from "@/lib/skills/creator";

export const dynamic = "force-dynamic";

export default async function DashboardCollectionsPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, creatorData, library] = await Promise.all([
    getTranslations("Dashboard"),
    getCreatorSkills(),
    getUserSkillLibrary(),
  ]);

  if (!creatorData || !library) redirect(`/${locale}/login`);

  return (
    <>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">Thư viện skill của bạn</p>
          <h1 className="mt-3 font-geist text-5xl font-bold tracking-tight">{t("collections")}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">Tổ chức và gom nhóm các kỹ năng của bạn theo dự án hoặc chủ đề để quản lý quy trình làm việc hiệu quả hơn.</p>
        </div>
      </header>

      <DashboardCollections library={library} uploaded={creatorData.skills} locale={locale} />
    </>
  );
}
