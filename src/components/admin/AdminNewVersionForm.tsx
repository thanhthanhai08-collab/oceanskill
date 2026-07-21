"use client";

import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {savePlatformSkillDraft, type AdminSkillActionState} from "@/app/[locale]/admin/skills/actions";

const initialState: AdminSkillActionState = {status: "idle"};

function nextPatch(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  return match ? `${match[1]}.${match[2]}.${Number(match[3]) + 1}` : "1.0.0";
}

function Submit({labels}: {labels: Record<string, string>}) {
  const {pending} = useFormStatus();
  return <button disabled={pending} className="btn-payment min-h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">{pending ? labels.creatingVersion : labels.createVersion}</button>;
}

export default function AdminNewVersionForm({slug, currentVersion, labels}: {slug: string; currentVersion: string; labels: Record<string, string>}) {
  const [state, action] = useActionState(savePlatformSkillDraft, initialState);
  const input = "min-h-11 rounded-xl border border-outline-variant/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  return <form action={action} className="mt-5 rounded-2xl border border-outline-variant/45 bg-background/55 p-4">
    <input type="hidden" name="skillName" value={slug}/>
    <div className="flex flex-wrap items-end gap-3"><label className="min-w-36 flex-1 text-xs font-semibold">{labels.newVersion}<input required name="version" defaultValue={nextPatch(currentVersion)} pattern="\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?" className={`mt-2 w-full ${input}`}/></label><label className="min-w-64 flex-[2] text-xs font-semibold">{labels.newVersionZip}<input required name="bundle" type="file" accept=".zip,.rar,application/zip,application/vnd.rar,application/x-rar-compressed" className={`mt-2 w-full ${input} file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary`}/></label><Submit labels={labels}/></div>
    <p className="mt-3 text-xs leading-5 text-on-surface-variant">{labels.newVersionNote}</p>
    {state.status !== "idle" && <p role="status" className={`mt-3 text-xs ${state.status === "success" ? "text-tertiary" : "text-error"}`}>{state.status === "success" ? labels.newVersionSaved : `${labels.failed}: ${state.message}`}</p>}
  </form>;
}
