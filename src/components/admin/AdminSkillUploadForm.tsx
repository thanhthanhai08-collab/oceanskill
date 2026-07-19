"use client";

import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {savePlatformSkillDraft, type AdminSkillActionState} from "@/app/[locale]/admin/skills/actions";

const initialState: AdminSkillActionState = {status: "idle"};

function Submit({idle, pendingLabel}: {idle: string; pendingLabel: string}) {
  const {pending} = useFormStatus();
  return <button disabled={pending} className="btn-payment min-h-12 rounded-xl px-6 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">{pending ? pendingLabel : idle}</button>;
}

function errorLabel(code: string | undefined, labels: Record<string, string>) {
  if (code === "gemini_not_configured") return labels.errorGeminiNotConfigured;
  if (code?.startsWith("gemini_request_failed_401") || code?.startsWith("gemini_request_failed_403")) return labels.errorGeminiKey;
  if (code?.startsWith("gemini_request_failed_429")) return labels.errorGeminiQuota;
  if (code?.startsWith("gemini_")) return labels.errorGeminiResponse;
  if (code === "scan_failed") return labels.errorScan;
  if (code?.startsWith("invalid_bundle")) return labels.errorZip;
  if (code === "platform_skill_version_exists") return labels.errorVersionExists;
  if (code === "skill_slug_owned_by_user") return labels.errorSlugOwned;
  return labels.errorGeneric;
}

export default function AdminSkillUploadForm({labels}: {labels: Record<string, string>}) {
  const [state, action] = useActionState(savePlatformSkillDraft, initialState);
  const input = "mt-2 min-h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
  return <form action={action} className="rounded-3xl border border-outline-variant/45 bg-surface-container-low/60 p-5 shadow-sm sm:p-7">
    <div className="grid gap-5 md:grid-cols-[1fr_14rem]">
      <label className="text-sm font-semibold">{labels.skillName}<input required name="skillName" minLength={2} maxLength={160} placeholder={labels.skillNamePlaceholder} className={input}/></label>
      <label className="text-sm font-semibold">{labels.version}<input required name="version" defaultValue="1.0.0" pattern="\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?" className={input}/></label>
    </div>
    <label className="mt-5 block text-sm font-semibold">{labels.zipFile}<span className="mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/60 bg-background/50 px-6 text-center hover:border-primary/60"><span className="material-symbols-outlined text-4xl text-primary">folder_zip</span><span className="mt-3 max-w-xl text-xs leading-5 text-on-surface-variant">{labels.zipHint}</span><input required name="bundle" type="file" accept=".zip,application/zip" className="mt-4 block max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary"/></span></label>
    {state.status !== "idle" && <div role="status" className={`mt-5 rounded-xl border p-4 text-sm ${state.status === "success" ? "border-tertiary/40 bg-tertiary/10 text-tertiary" : "border-error/40 bg-error/10 text-error"}`}>{state.status === "success" ? (state.message === "draft_saved_manual" ? labels.savedManual : labels.saved) : `${labels.failed}: ${errorLabel(state.message, labels)}`}</div>}
    {state.checks && <div className="mt-5 grid gap-2 sm:grid-cols-2">{state.checks.map((check) => <div key={check.id} className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-xs"><span className={`material-symbols-outlined text-[18px] ${check.passed ? "text-tertiary" : "text-error"}`}>{check.passed ? "check_circle" : "error"}</span>{check.message}</div>)}</div>}
    <div className="mt-6 flex items-center justify-between gap-4"><p className="max-w-2xl text-xs leading-5 text-on-surface-variant">{labels.saveNote}</p><Submit idle={labels.save} pendingLabel={labels.saving}/></div>
  </form>;
}
