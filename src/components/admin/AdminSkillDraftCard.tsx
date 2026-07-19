"use client";

import Link from "next/link";
import {useLocale} from "next-intl";
import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {publishPlatformSkillDraft, updatePlatformSkillDraft, type AdminSkillActionState} from "@/app/[locale]/admin/skills/actions";
import type {PlatformSkillDraft} from "@/lib/skills/platform-publishing";

const initialState: AdminSkillActionState = {status: "idle"};
const categories = ["ai-agent", "security", "productivity", "design", "marketing", "development", "research"];
const clients = ["codex", "claude-code", "cursor", "generic-mcp"];
const tags = ["ai-agent", "automation", "design-system", "frontend", "mcp", "productivity", "research", "security", "ui-ux"];

function PendingButton({idle, pendingLabel, className, disabled = false}: {idle: string; pendingLabel: string; className: string; disabled?: boolean}) {
  const {pending} = useFormStatus();
  return <button disabled={pending || disabled} className={className}>{pending ? pendingLabel : idle}</button>;
}

export default function AdminSkillDraftCard({draft, labels}: {draft: PlatformSkillDraft; labels: Record<string, string>}) {
  const locale = useLocale();
  const [updateState, updateAction] = useActionState(updatePlatformSkillDraft, initialState);
  const [publishState, publishAction] = useActionState(publishPlatformSkillDraft, initialState);
  const editable = draft.status === "review";
  const metadataReady = draft.metadata_source !== "manual_required";
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
      <div className="grid gap-4 md:grid-cols-3"><label className="text-xs font-semibold">{labels.category}<select disabled={!editable} name="category" defaultValue={draft.category} className={input}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">{labels.license}<input disabled={!editable} name="licenseSpdx" defaultValue={draft.license_spdx ?? ""} className={input}/></label><label className="text-xs font-semibold">{labels.sourceUrl}<input disabled={!editable} name="sourceUrl" type="url" defaultValue={draft.source_url ?? ""} className={input}/></label></div>
      <fieldset disabled={!editable}><legend className="text-xs font-semibold">{labels.clients}</legend><div className="mt-2 flex flex-wrap gap-2">{clients.map((item) => <label key={item} className="rounded-lg border border-outline-variant/45 bg-background/60 px-3 py-2 text-xs"><input name="compatibleClients" value={item} type="checkbox" defaultChecked={draft.compatible_clients.includes(item)} className="mr-2 accent-primary"/>{item}</label>)}</div></fieldset>
      <fieldset disabled={!editable}><legend className="text-xs font-semibold">{labels.tags}</legend><div className="mt-2 flex flex-wrap gap-2">{tags.map((item) => <label key={item} className="rounded-lg border border-outline-variant/45 bg-background/60 px-3 py-2 text-xs"><input name="tags" value={item} type="checkbox" defaultChecked={draft.tags.includes(item)} className="mr-2 accent-primary"/>{item}</label>)}</div></fieldset>
      {updateState.status !== "idle" && <p role="status" className={`text-xs ${updateState.status === "success" ? "text-tertiary" : "text-error"}`}>{updateState.status === "success" ? labels.updated : `${labels.failed}: ${updateState.message}`}</p>}
      {editable && <div className="flex justify-end"><PendingButton idle={labels.update} pendingLabel={labels.updating} className="min-h-11 rounded-xl border border-primary/35 px-5 text-sm font-semibold text-primary disabled:opacity-60"/></div>}
    </form>

    {editable && <div className="mt-4 flex justify-end"><Link href={`/${locale}/admin/skills/${draft.id}/preview`} className="min-h-11 rounded-xl border border-primary/40 px-5 py-3 text-sm font-semibold text-primary">{locale === "vi" ? "Xem trước hiển thị" : "Preview listing"}</Link></div>}
    {editable && <form action={publishAction} className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4"><input type="hidden" name="draftId" value={draft.id}/><p className="max-w-2xl text-xs leading-5 text-on-surface-variant">{labels.publishNote}</p><PendingButton disabled={!metadataReady} idle={labels.publish} pendingLabel={labels.publishing} className="btn-payment min-h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"/>{publishState.status !== "idle" && <p role="status" className={`w-full text-xs ${publishState.status === "success" ? "text-tertiary" : "text-error"}`}>{publishState.status === "success" ? labels.publishSuccess : `${labels.failed}: ${publishState.message}`}</p>}</form>}
  </article>;
}
