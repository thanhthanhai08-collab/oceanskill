"use client";

import Link from "next/link";
import {useLocale} from "next-intl";
import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {publishPlatformSkillDraft, updatePlatformSkillDraft, type AdminSkillActionState} from "@/app/[locale]/admin/skills/actions";
import type {PlatformSkillDraft} from "@/lib/skills/platform-publishing";
import type {PlatformAuthor} from "@/lib/skills/platform-author-schema";

const initialState: AdminSkillActionState = {status: "idle"};
const categories = ["ai-agent", "security", "productivity", "design", "marketing", "development", "research"];
const clients = [
  {value: "codex", label: "Codex"},
  {value: "claude-code", label: "Claude Code"},
  {value: "cursor", label: "Cursor"},
  {value: "antigravity", label: "Antigravity"},
];
const tags = ["ai-agent", "automation", "design-system", "frontend", "mcp", "productivity", "research", "security", "ui-ux"];

function PendingButton({idle, pendingLabel, className, disabled = false}: {idle: string; pendingLabel: string; className: string; disabled?: boolean}) {
  const {pending} = useFormStatus();
  return <button disabled={pending || disabled} className={className}>{pending ? pendingLabel : idle}</button>;
}

function faqValue(draft: PlatformSkillDraft, locale: "en" | "vi", field: "question" | "answer", order: 1 | 2 | 3) {
  return draft[`faq_${field}_${locale}_${order}` as keyof PlatformSkillDraft] as string;
}

export default function AdminSkillDraftCard({draft, authors, labels}: {draft: PlatformSkillDraft; authors: PlatformAuthor[]; labels: Record<string, string>}) {
  const locale = useLocale();
  const [updateState, updateAction] = useActionState(updatePlatformSkillDraft, initialState);
  const [publishState, publishAction] = useActionState(publishPlatformSkillDraft, initialState);
  const editable = draft.status === "review";
  const metadataReady = draft.metadata_source !== "manual_required" && Boolean(draft.author_id);
  const input = "mt-2 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-background/65 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60";
  const hash = draft.skill_versions?.skill_md_hash ?? "—";

  return <article className="rounded-3xl border border-outline-variant/45 bg-surface-container-low/55 p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/40 pb-5">
      <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-geist text-xl font-bold">{draft.skills?.slug ?? draft.title_en}</h2><span className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${editable ? "bg-secondary/12 text-secondary" : "bg-tertiary/12 text-tertiary"}`}>{editable ? labels.review : labels.published}</span></div><p className="mt-2 text-xs text-on-surface-variant">v{draft.version} · {draft.gemini_model}</p></div>
      <div className="max-w-full text-right"><p className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">SHA-256</p><p title={hash} className="mt-1 max-w-[20rem] truncate font-mono text-[11px] text-primary">{hash}</p></div>
    </div>

    {!metadataReady && <div className="mt-5 rounded-2xl border border-secondary/35 bg-secondary/10 p-4 text-sm leading-6 text-on-surface-variant"><strong className="text-secondary">{labels.manualRequiredTitle}</strong><p className="mt-1">{labels.manualRequiredDescription}</p></div>}

    <form action={updateAction} className="mt-5 space-y-5">
      <input type="hidden" name="draftId" value={draft.id}/>
      <div className="grid gap-4 lg:grid-cols-2"><label className="text-xs font-semibold">{labels.titleEn}<input disabled={!editable} required name="titleEn" defaultValue={draft.title_en} className={input}/></label><label className="text-xs font-semibold">{labels.titleVi}<input disabled={!editable} required name="titleVi" defaultValue={draft.title_vi} className={input}/></label></div>
      <div className="grid gap-4 lg:grid-cols-2"><label className="text-xs font-semibold">{labels.descriptionEn}<textarea disabled={!editable} required name="descriptionEn" defaultValue={draft.description_en} rows={4} className={input}/></label><label className="text-xs font-semibold">{labels.descriptionVi}<textarea disabled={!editable} required name="descriptionVi" defaultValue={draft.description_vi} rows={4} className={input}/></label></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold">{labels.author}<select disabled={!editable} required name="authorId" defaultValue={draft.author_id ?? ""} className={input}><option value="">{labels.chooseAuthor}</option>{authors.filter((author) => author.verified).map((author) => <option key={author.id} value={author.id}>{author.name} ({author.id})</option>)}</select></label><label className="text-xs font-semibold">{labels.category}<select disabled={!editable} name="category" defaultValue={draft.category} className={input}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">{labels.license}<input disabled={!editable} name="licenseSpdx" defaultValue={draft.license_spdx ?? ""} className={input}/></label><label className="text-xs font-semibold">{labels.sourceUrl}<input disabled={!editable} name="sourceUrl" type="url" defaultValue={draft.source_url ?? ""} className={input}/></label></div>
      <fieldset disabled={!editable}><legend className="text-xs font-semibold">{labels.clients}</legend><div className="mt-2 flex flex-wrap gap-2">{clients.map((item) => <label key={item.value} className="rounded-lg border border-outline-variant/45 bg-background/60 px-3 py-2 text-xs"><input name="compatibleClients" value={item.value} type="checkbox" defaultChecked={draft.compatible_clients.includes(item.value)} className="mr-2 accent-primary"/>{item.label}</label>)}</div></fieldset>
      <fieldset disabled={!editable} className="rounded-2xl border border-outline-variant/40 p-4"><legend className="px-2 text-xs font-semibold">{labels.skillDetails}</legend><p className="mb-4 text-xs leading-5 text-on-surface-variant">{labels.skillDetailsNote}</p><div className="grid gap-5 lg:grid-cols-2">{(["En", "Vi"] as const).map((localeCode) => <div key={localeCode} className="space-y-4 rounded-xl bg-background/45 p-4"><h3 className="font-geist text-sm font-bold">{localeCode === "En" ? "English" : "Tiếng Việt"}</h3><label className="block text-xs font-semibold">{labels.detailHeadline}<input name={`detailHeadline${localeCode}`} defaultValue={draft[`detail_headline_${localeCode.toLowerCase()}` as "detail_headline_en" | "detail_headline_vi"]} maxLength={180} className={input}/></label><label className="block text-xs font-semibold">{labels.detailOverview}<textarea name={`detailOverview${localeCode}`} defaultValue={draft[`detail_overview_${localeCode.toLowerCase()}` as "detail_overview_en" | "detail_overview_vi"]} rows={4} maxLength={1200} className={input}/></label><label className="block text-xs font-semibold">{labels.detailFeatureOneTitle}<input name={`detailFeatureOneTitle${localeCode}`} defaultValue={draft[`detail_feature_one_title_${localeCode.toLowerCase()}` as "detail_feature_one_title_en" | "detail_feature_one_title_vi"]} maxLength={120} className={input}/></label><label className="block text-xs font-semibold">{labels.detailFeatureOneDescription}<textarea name={`detailFeatureOneDescription${localeCode}`} defaultValue={draft[`detail_feature_one_description_${localeCode.toLowerCase()}` as "detail_feature_one_description_en" | "detail_feature_one_description_vi"]} rows={3} maxLength={600} className={input}/></label><label className="block text-xs font-semibold">{labels.detailFeatureTwoTitle}<input name={`detailFeatureTwoTitle${localeCode}`} defaultValue={draft[`detail_feature_two_title_${localeCode.toLowerCase()}` as "detail_feature_two_title_en" | "detail_feature_two_title_vi"]} maxLength={120} className={input}/></label><label className="block text-xs font-semibold">{labels.detailFeatureTwoDescription}<textarea name={`detailFeatureTwoDescription${localeCode}`} defaultValue={draft[`detail_feature_two_description_${localeCode.toLowerCase()}` as "detail_feature_two_description_en" | "detail_feature_two_description_vi"]} rows={3} maxLength={600} className={input}/></label></div>)}</div></fieldset>
      <fieldset disabled={!editable} className="rounded-2xl border border-outline-variant/40 p-4"><legend className="px-2 text-xs font-semibold">{labels.skillFaqs}</legend><p className="mb-4 text-xs leading-5 text-on-surface-variant">{labels.skillFaqsNote}</p><div className="grid gap-5 lg:grid-cols-2">{(["En", "Vi"] as const).map((localeCode) => {const localeKey = localeCode.toLowerCase() as "en" | "vi"; return <div key={localeCode} className="space-y-4 rounded-xl bg-background/45 p-4"><h3 className="font-geist text-sm font-bold">{localeCode === "En" ? "English" : "Tiếng Việt"}</h3>{([1, 2, 3] as const).map((order) => <div key={order} className="rounded-xl border border-outline-variant/35 p-3"><p className="font-mono text-[10px] uppercase tracking-wider text-primary">FAQ {order}</p><label className="mt-3 block text-xs font-semibold">{labels.faqQuestion}<input name={`faqQuestion${localeCode}${order}`} defaultValue={faqValue(draft, localeKey, "question", order)} maxLength={300} className={input}/></label><label className="mt-3 block text-xs font-semibold">{labels.faqAnswer}<textarea name={`faqAnswer${localeCode}${order}`} defaultValue={faqValue(draft, localeKey, "answer", order)} rows={3} maxLength={1200} className={input}/></label></div>)}</div>;})}</div></fieldset>
      <fieldset disabled={!editable}><legend className="text-xs font-semibold">{labels.tags}</legend><div className="mt-2 flex flex-wrap gap-2">{tags.map((item) => <label key={item} className="rounded-lg border border-outline-variant/45 bg-background/60 px-3 py-2 text-xs"><input name="tags" value={item} type="checkbox" defaultChecked={draft.tags.includes(item)} className="mr-2 accent-primary"/>{item}</label>)}</div></fieldset>
      {updateState.status !== "idle" && <p role="status" className={`text-xs ${updateState.status === "success" ? "text-tertiary" : "text-error"}`}>{updateState.status === "success" ? labels.updated : `${labels.failed}: ${updateState.message}`}</p>}
      {editable && <div className="flex justify-end"><PendingButton idle={labels.update} pendingLabel={labels.updating} className="min-h-11 rounded-xl border border-primary/35 px-5 text-sm font-semibold text-primary disabled:opacity-60"/></div>}
    </form>

    {editable && <div className="mt-4 flex justify-end"><Link href={`/${locale}/skills/${draft.skills?.slug ?? draft.skill_id}?preview=${draft.id}`} className="min-h-11 rounded-xl border border-primary/40 px-5 py-3 text-sm font-semibold text-primary">{locale === "vi" ? "Xem trước như production" : "Production preview"}</Link></div>}
    {editable && <form action={publishAction} className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4"><input type="hidden" name="draftId" value={draft.id}/><p className="max-w-2xl text-xs leading-5 text-on-surface-variant">{labels.publishNote}</p><PendingButton disabled={!metadataReady} idle={labels.publish} pendingLabel={labels.publishing} className="btn-payment min-h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"/>{publishState.status !== "idle" && <p role="status" className={`w-full text-xs ${publishState.status === "success" ? "text-tertiary" : "text-error"}`}>{publishState.status === "success" ? labels.publishSuccess : `${labels.failed}: ${publishState.message}`}</p>}</form>}
  </article>;
}
