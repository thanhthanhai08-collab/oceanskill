import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getCreatorSkills, getFoundationSkills} from "@/lib/skills/creator";
import CreatorSkillForm from "@/components/dashboard/CreatorSkillForm";
import CreatorSkillList from "@/components/dashboard/CreatorSkillList";
import SkillsFilter from "@/components/dashboard/SkillsFilter";
import {getDomainVisual} from "@/data/mockData";

export const dynamic = "force-dynamic";

const FREE_PLAN_LIMIT = 5;

export default async function DashboardSkillsPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, dashboardT, creatorData, foundationSkills] = await Promise.all([
    getTranslations("CreatorSkills"),
    getTranslations("Dashboard"),
    getCreatorSkills(),
    getFoundationSkills(),
  ]);

  if (!creatorData) redirect(`/${locale}/login`);

  const userSkillCount = creatorData.skills.length;
  const isAtLimit = userSkillCount >= FREE_PLAN_LIMIT;

  const skillCardLabels = {
    empty: t("empty"),
    privateBadge: t("privateBadge"),
    active: t("active"),
    draft: t("draft"),
    archived: t("archived"),
    version: t("version"),
    updated: t("updated"),
    contentHidden: t("contentHidden"),
  };

  const formLabels = {
    fields: t.raw("fields") as Record<string, string>,
    placeholders: t.raw("placeholders") as Record<string, string>,
    domains: t.raw("domains") as Record<string, string>,
    clients: t.raw("clients") as Record<string, string>,
    submit: t("submit"),
    submitting: t("submitting"),
    success: t("success"),
    scanFailed: t("scanFailed"),
    createFailed: t("createFailed"),
    invalidForm: t("invalidForm"),
    scanChecks: t("scanChecks"),
    passed: t("passed"),
    failed: t("failed"),
  };

  return (
    <>
      {/* Page header */}
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("eyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-on-surface-variant">{t("description")}</p>
      </header>

      {/* Security notice */}
      <section className="mt-8 rounded-2xl border border-secondary/30 bg-secondary/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-secondary">verified_user</span>
          {t("securityTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("securityDescription")}</p>
      </section>

      {/* ── Section 1: Foundation Skills (platform-curated) ── */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-geist text-2xl font-semibold">{dashboardT("foundationSkills")}</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            {foundationSkills.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-on-surface-variant">{dashboardT("foundationSkillsDescription")}</p>

        <div className="mt-5">
          {foundationSkills.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
              {dashboardT("noFoundationSkills")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {foundationSkills.map((skill) => {
                const visual = getDomainVisual(skill.domain);
                return (
                  <div key={skill.id} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
                    <div className="flex items-start gap-3">
                      <span className={`material-symbols-outlined text-[22px] ${visual.accentClass}`}>{visual.icon}</span>
                      <div className="min-w-0">
                        <p className="font-geist font-semibold">{skill.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{skill.description}</p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-tertiary/10 px-2 py-0.5 font-mono text-[10px] text-tertiary">
                        v{skill.current_version ?? "–"}
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-on-surface-variant">{skill.domain}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: User Skills ── */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-geist text-2xl font-semibold">{t("yourSkills")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("mcpHint")}</p>
          </div>
          {/* Plan limit badge */}
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${isAtLimit ? "border-error/40 bg-error/5" : "border-outline-variant/40 bg-surface-container-low/65"}`}>
            <span className={`material-symbols-outlined text-[18px] ${isAtLimit ? "text-error" : "text-on-surface-variant"}`}>
              {isAtLimit ? "warning" : "deployed_code"}
            </span>
            <span className="font-mono text-xs">
              <span className={isAtLimit ? "text-error font-bold" : ""}>{userSkillCount}</span>
              <span className="text-on-surface-variant"> / {FREE_PLAN_LIMIT} {dashboardT("freePlanSkills")}</span>
            </span>
            {isAtLimit && (
              <a href="/dashboard/billing" className="ml-2 rounded-lg bg-primary/15 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/25">
                {dashboardT("upgrade")}
              </a>
            )}
          </div>
        </div>

        <div className="mt-6">
          <SkillsFilter
            skills={creatorData.skills}
            renderSkill={(skill) => (
              <CreatorSkillList
                key={skill.id}
                skills={[skill]}
                locale={locale}
                labels={skillCardLabels}
              />
            )}
            labels={{
              searchPlaceholder: t("searchPlaceholder"),
              filterAll: t("filterAll"),
              filterActive: t("active"),
              filterDraft: t("draft"),
              empty: t("empty"),
            }}
          />
        </div>

        {/* Upload new skill (only if below limit) */}
        {!isAtLimit && (
          <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5 sm:p-7">
            <h3 className="font-geist text-2xl font-semibold">{t("newSkill")}</h3>
            <div className="mt-6">
              <CreatorSkillForm labels={formLabels} />
            </div>
          </section>
        )}

        {isAtLimit && (
          <div className="mt-6 rounded-2xl border border-error/30 bg-error/5 p-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-error">block</span>
            <p className="mt-3 font-geist text-lg font-semibold text-error">{dashboardT("skillLimitReached")}</p>
            <p className="mt-2 text-sm text-on-surface-variant">{dashboardT("skillLimitDescription", {limit: FREE_PLAN_LIMIT})}</p>
            <a href="/dashboard/billing" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90">
              <span className="material-symbols-outlined text-[18px]">upgrade</span>
              {dashboardT("upgradeNow")}
            </a>
          </div>
        )}
      </section>
    </>
  );
}
