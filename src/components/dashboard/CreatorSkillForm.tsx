"use client";

import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {createPrivateSkill, type CreateSkillState} from "@/app/[locale]/dashboard/actions";

export type CreatorSkillFormLabels = Readonly<{
  fields: Record<string, string>; placeholders: Record<string, string>; categories: Record<string, string>; clients: Record<string, string>;
  submit: string; submitting: string; success: string; scanFailed: string; createFailed: string; invalidForm: string; scanChecks: string; passed: string; failed: string;
}>;

const initialState: CreateSkillState = {status: "idle"};
const categories = ["ai-agent", "security", "productivity", "design", "marketing", "development", "research"];
const clients = ["codex", "claude-code", "cursor", "generic-mcp"];

function SubmitButton({labels}: {labels: CreatorSkillFormLabels}) {
  const {pending} = useFormStatus();
  return <button disabled={pending} className="btn-payment min-h-11 rounded-xl px-6 py-3 text-sm font-semibold transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">{pending ? labels.submitting : labels.submit}</button>;
}

export default function CreatorSkillForm({labels}: {readonly labels: CreatorSkillFormLabels}) {
  const [state, action] = useActionState(createPrivateSkill, initialState);
  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
  const errorMessage = state.message === "scan_failed" ? labels.scanFailed : state.message === "create_failed" || state.message === "skill_limit_reached" ? labels.createFailed : labels.invalidForm;
  return <form action={action} className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium">{labels.fields.title}<input required name="title" maxLength={160} placeholder={labels.placeholders.title} className={inputClass}/></label>
      <label className="text-sm font-medium">{labels.fields.slug}<input required name="slug" maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder={labels.placeholders.slug} className={inputClass}/></label>
    </div>
    <label className="block text-sm font-medium">{labels.fields.description}<textarea required name="description" minLength={10} maxLength={1000} rows={3} placeholder={labels.placeholders.description} className={inputClass}/></label>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium">{labels.fields.category}<select required name="category" className={inputClass}>{categories.map((category) => <option key={category} value={category}>{labels.categories[category]}</option>)}</select></label>
      <label className="text-sm font-medium">{labels.fields.version}<input required name="version" defaultValue="1.0.0" pattern="\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?" className={inputClass}/></label>
      <label className="text-sm font-medium sm:col-span-2 lg:col-span-1">{labels.fields.license}<input name="licenseSpdx" maxLength={80} placeholder={labels.placeholders.license} className={inputClass}/></label>
    </div>
    <label className="block text-sm font-medium">{labels.fields.sourceUrl}<input name="sourceUrl" type="url" inputMode="url" placeholder={labels.placeholders.sourceUrl} className={inputClass}/></label>
    <fieldset><legend className="text-sm font-medium">{labels.fields.clients}</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{clients.map((client) => <label key={client} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/45 bg-surface-container-low/50 px-4 py-3 text-sm"><input type="checkbox" name="compatibleClients" value={client} defaultChecked={client === "codex"} className="h-4 w-4 accent-primary"/>{labels.clients[client]}</label>)}</div></fieldset>
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <label className="block text-sm font-medium">{labels.fields.content}<textarea name="content" maxLength={262144} rows={14} spellCheck={false} placeholder={labels.placeholders.content} className={`${inputClass} resize-y font-mono leading-6`}/></label>
      <label className="block text-sm font-medium">{labels.fields.bundle ?? "Skill package (.zip or .rar)"}<span className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low px-5 text-center transition hover:border-primary/60 hover:bg-primary/5"><span className="material-symbols-outlined text-3xl text-primary">folder_zip</span><span className="mt-3 text-xs leading-5 text-on-surface-variant">{labels.placeholders.bundle ?? "Optional ZIP or RAR containing one SKILL.md and its reference files. Scripts are stored and scanned, never executed."}</span><input name="bundle" type="file" accept=".zip,.rar,application/zip,application/vnd.rar,application/x-rar-compressed" className="mt-4 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary"/></span></label>
    </div>
    {state.status !== "idle" && <div role="status" className={`rounded-xl border p-4 text-sm ${state.status === "success" ? "border-tertiary/40 bg-tertiary/10 text-tertiary" : "border-error/40 bg-error/10 text-error"}`}>{state.status === "success" ? labels.success : errorMessage}</div>}
    {state.checks && <div><p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{labels.scanChecks}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{state.checks.map((check) => <div key={check.id} className="flex items-center gap-3 rounded-xl bg-surface-container px-3 py-2 text-xs"><span className={`material-symbols-outlined text-[18px] ${check.passed ? "text-tertiary" : "text-error"}`}>{check.passed ? "check_circle" : "error"}</span><span className="min-w-0 flex-1">{check.message}</span><span className="font-mono text-[10px]">{check.passed ? labels.passed : labels.failed}</span></div>)}</div></div>}
    <div className="flex justify-end"><SubmitButton labels={labels}/></div>
  </form>;
}
