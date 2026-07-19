import type {Metadata} from "next";
import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {notFound, redirect} from "next/navigation";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import AdminNav from "@/components/admin/AdminNav";
import AdminNewVersionForm from "@/components/admin/AdminNewVersionForm";
import AdminSkillDraftCard from "@/components/admin/AdminSkillDraftCard";
import AdminSkillUploadForm from "@/components/admin/AdminSkillUploadForm";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {listPlatformSkillDrafts, listPublishedPlatformSkills} from "@/lib/skills/platform-publishing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function AdminSkillsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const admin = await getPlatformAdmin();
  if (!admin) {
    const {createClient} = await import("@/lib/supabase/server");
    const {data: {user}} = await (await createClient()).auth.getUser();
    if (!user) redirect(`/${locale}/login?next=/${locale}/admin/skills`);
    notFound();
  }

  const [t, drafts, platformSkills] = await Promise.all([getTranslations("AdminSkills"), listPlatformSkillDrafts(), listPublishedPlatformSkills()]);
  const labels = t.raw("labels") as Record<string, string>;
  const reviewDrafts = drafts.filter((draft) => draft.status === "review");
  const skillsWithReviewDraft = new Set(reviewDrafts.map((draft) => draft.skill_id));

  return <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
    <AdminNav locale={locale} active="skills"/>
    <div className="flex flex-wrap items-start justify-between gap-5"><header><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p><h1 className="mt-3 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-on-surface-variant">{t("description")}</p></header><Link href={`/${locale}/dashboard`} className="min-h-11 rounded-xl border border-outline-variant/50 px-4 py-3 text-sm font-semibold">{t("back")}</Link></div>

    <section className="mt-9"><AdminSkillUploadForm labels={labels}/></section>

    <section className="mt-12"><div className="mb-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{labels.platformSkillsEyebrow}</p><h2 className="mt-2 font-geist text-2xl font-bold">{labels.platformSkillsTitle}</h2><p className="mt-2 text-sm text-on-surface-variant">{labels.platformSkillsDescription}</p></div><div className="space-y-3">{platformSkills.map((skill) => {
      const pending = skillsWithReviewDraft.has(skill.id);
      return <AdminDisclosure key={skill.id} title={skill.title} meta={`${skill.slug} · ${labels.currentVersion} ${skill.current_version}`} icon="deployed_code" badge={pending ? <span className="hidden rounded-full bg-secondary/12 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary sm:inline">{labels.pendingReview}</span> : undefined}>
        {pending ? <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-4 text-sm text-on-surface-variant">{labels.pendingReview}</p> : <AdminNewVersionForm slug={skill.slug} currentVersion={skill.current_version} labels={labels}/>}
      </AdminDisclosure>;
    })}</div></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{t("queueEyebrow")}</p><h2 className="mt-2 font-geist text-2xl font-bold">{t("queueTitle")}</h2></div><span className="font-mono text-xs text-on-surface-variant">{reviewDrafts.length}</span></div>{reviewDrafts.length ? <div className="space-y-3">{reviewDrafts.map((draft) => <AdminDisclosure key={draft.id} title={draft.skills?.slug ?? draft.title_en} meta={`v${draft.version} · ${draft.metadata_source === "manual_required" ? labels.manualRequiredTitle : labels.review}`} icon="pending_actions" badge={<span className="hidden rounded-full bg-secondary/12 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary sm:inline">{labels.review}</span>}><AdminSkillDraftCard draft={draft} labels={labels}/></AdminDisclosure>)}</div> : <div className="rounded-3xl border border-dashed border-outline-variant/55 p-12 text-center text-sm text-on-surface-variant">{t("empty")}</div>}</section>
  </main>;
}
