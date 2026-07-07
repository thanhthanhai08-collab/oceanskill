import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getCreatorSkills, getUserSkillLibrary} from "@/lib/skills/creator";
import DashboardSkillsTabs from "@/components/dashboard/DashboardSkillsTabs";

export const dynamic = "force-dynamic";

export default async function DashboardSkillsPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, creatorData, library] = await Promise.all([getTranslations("CreatorSkills"), getCreatorSkills(), getUserSkillLibrary()]);
  if (!creatorData || !library) redirect(`/${locale}/login`);
  const limit = creatorData.limit;
  const atLimit = creatorData.skills.length >= limit;
  const cardLabels = {empty: t("emptyUploaded"), privateBadge: t("privateBadge"), active: t("active"), draft: t("draft"), archived: t("archived"), version: t("version"), updated: t("updated"), contentHidden: t("contentHidden")};
  const formLabels = {fields: t.raw("fields") as Record<string, string>, placeholders: t.raw("placeholders") as Record<string, string>, domains: t.raw("domains") as Record<string, string>, clients: t.raw("clients") as Record<string, string>, submit: t("submit"), submitting: t("submitting"), success: t("success"), scanFailed: t("scanFailed"), createFailed: t("createFailed"), invalidForm: t("invalidForm"), scanChecks: t("scanChecks"), passed: t("passed"), failed: t("failed")};
  const tabsLabels = {
    tabAll: t("tabAll"), tabPlatform: t("tabPlatform"), tabUploaded: t("tabUploaded"),
    platformBadge: t("platformBadge"), uploadedBadge: t("uploadedBadge"),
    allSkillsDescription: t("allSkillsDescription"), platformSkillsDescription: t("platformSkillsDescription"), uploadedSkillsDescription: t("uploadedSkillsDescription", {limit}),
    emptyAll: t("emptyAll"), emptyPlatform: t("emptyPlatform"),
    addSkill: t("addSkill"), addSkillHint: t("addSkillHint"), limitTitle: t("limitTitle"), limitDescription: t("limitDescription", {limit}), upgradePlan: t("upgradePlan"), close: t("close"),
    securityDescription: t("securityDescription"),
    removeSkill: t("removeSkill"), removeFailed: t("removeFailed"),
  };

  return <>
    <header><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p><h1 className="mt-3 font-geist text-5xl font-bold tracking-tight">{t("title")}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("description")}</p></header>

    <DashboardSkillsTabs library={library} uploaded={creatorData.skills} locale={locale} limit={limit} atLimit={atLimit} labels={tabsLabels} cardLabels={cardLabels} formLabels={formLabels}/>
  </>;
}
