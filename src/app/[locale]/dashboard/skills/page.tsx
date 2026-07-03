import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getCreatorSkills, getUserSkillLibrary, type FoundationSkill} from "@/lib/skills/creator";
import CreatorSkillList from "@/components/dashboard/CreatorSkillList";
import CreatorSkillAddCard from "@/components/dashboard/CreatorSkillAddCard";
import {getDomainVisual} from "@/data/mockData";

export const dynamic = "force-dynamic";

function PlatformCard({skill, typeLabel}: {readonly skill: FoundationSkill; readonly typeLabel: string}) {
  const visual = getDomainVisual(skill.domain);
  return <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5"><div className="flex items-start gap-3"><span className={`material-symbols-outlined text-[22px] ${visual.accentClass}`}>{visual.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-geist font-semibold">{skill.title}</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase text-primary">{typeLabel}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface-variant">{skill.description}</p><p className="mt-3 font-mono text-[10px] text-on-surface-variant">{skill.domain} · v{skill.current_version ?? "—"}</p></div></div></article>;
}

export default async function DashboardSkillsPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, creatorData, library] = await Promise.all([getTranslations("CreatorSkills"), getCreatorSkills(), getUserSkillLibrary()]);
  if (!creatorData || !library) redirect(`/${locale}/login`);
  const limit = creatorData.limit;
  const atLimit = creatorData.skills.length >= limit;
  const total = library.length + creatorData.skills.length;
  const cardLabels = {empty: t("emptyUploaded"), privateBadge: t("privateBadge"), active: t("active"), draft: t("draft"), archived: t("archived"), version: t("version"), updated: t("updated"), contentHidden: t("contentHidden")};
  const formLabels = {fields: t.raw("fields") as Record<string, string>, placeholders: t.raw("placeholders") as Record<string, string>, domains: t.raw("domains") as Record<string, string>, clients: t.raw("clients") as Record<string, string>, submit: t("submit"), submitting: t("submitting"), success: t("success"), scanFailed: t("scanFailed"), createFailed: t("createFailed"), invalidForm: t("invalidForm"), scanChecks: t("scanChecks"), passed: t("passed"), failed: t("failed")};

  return <>
    <header><p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("eyebrow")}</p><h1 className="mt-3 font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1><p className="mt-3 max-w-3xl leading-7 text-on-surface-variant">{t("description")}</p></header>

    <section className="mt-9" aria-labelledby="all-user-skills"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">01</p><h2 id="all-user-skills" className="mt-2 font-geist text-2xl font-semibold">{t("allSkillsTitle")}</h2><p className="mt-2 text-sm text-on-surface-variant">{t("allSkillsDescription")}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">{total}</span></div>
      {total ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{library.map((skill) => <PlatformCard key={`all-platform-${skill.id}`} skill={skill} typeLabel={t("platformBadge")}/>)}{creatorData.skills.map((skill) => <PlatformCard key={`all-upload-${skill.id}`} skill={skill} typeLabel={t("uploadedBadge")}/>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">{t("emptyAll")}</p>}
    </section>

    <section className="mt-12 border-t border-outline-variant/30 pt-10" aria-labelledby="platform-library"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-secondary">02</p><h2 id="platform-library" className="mt-2 font-geist text-2xl font-semibold">{t("platformSkillsTitle")}</h2><p className="mt-2 text-sm text-on-surface-variant">{t("platformSkillsDescription")}</p></div><span className="rounded-full bg-secondary/10 px-3 py-1 font-mono text-xs text-secondary">{library.length}</span></div>
      {library.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{library.map((skill) => <PlatformCard key={skill.id} skill={skill} typeLabel={t("platformBadge")}/>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">{t("emptyPlatform")}</p>}
    </section>

    <section className="mt-12 border-t border-outline-variant/30 pt-10" aria-labelledby="uploaded-skills"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-tertiary">03</p><h2 id="uploaded-skills" className="mt-2 font-geist text-2xl font-semibold">{t("uploadedSkillsTitle")}</h2><p className="mt-2 text-sm text-on-surface-variant">{t("uploadedSkillsDescription", {limit})}</p></div><span className={`rounded-full px-3 py-1 font-mono text-xs ${atLimit ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"}`}>{creatorData.skills.length}/{limit}</span></div>
      <div className="mt-5"><CreatorSkillList skills={creatorData.skills} locale={locale} labels={cardLabels}/></div>
      <div className="mt-4"><CreatorSkillAddCard atLimit={atLimit} count={creatorData.skills.length} limit={limit} formLabels={formLabels} labels={{add: t("addSkill"), addHint: t("addSkillHint"), limitTitle: t("limitTitle"), limitDescription: t("limitDescription", {limit}), upgrade: t("upgradePlan"), close: t("close")}}/></div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-on-surface-variant"><span className="material-symbols-outlined text-[17px] text-secondary">verified_user</span>{t("securityDescription")}</p>
    </section>
  </>;
}
