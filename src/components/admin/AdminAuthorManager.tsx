"use client";

import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {createPlatformAuthor, deletePlatformAuthor, setPlatformAuthorPublished, updatePlatformAuthor, type AdminAuthorActionState} from "@/app/[locale]/admin/authors/actions";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import {authorCategories, authorGlowClasses, type PlatformAuthor} from "@/lib/skills/platform-author-schema";

const initialState: AdminAuthorActionState = {status: "idle"};
type Labels = Record<string, string>;

function Submit({idle, pending, variant = "primary"}: {idle: string; pending: string; variant?: "primary" | "danger" | "secondary"}) {
  const status = useFormStatus();
  const style = variant === "primary" ? "btn-payment" : variant === "danger" ? "border-error/45 text-error" : "border-primary/35 text-primary";
  return <button disabled={status.pending} className={`min-h-11 rounded-xl border px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-55 ${style}`}>{status.pending ? pending : idle}</button>;
}

function Status({state, labels}: {state: AdminAuthorActionState; labels: Labels}) {
  if (state.status === "idle") return null;
  return <p role="status" className={`mt-3 text-xs ${state.status === "success" ? "text-tertiary" : "text-error"}`}>{labels[state.message ?? "operation_failed"] ?? labels.operation_failed}</p>;
}

function AuthorFields({author, labels}: {author?: PlatformAuthor; labels: Labels}) {
  const input = "mt-2 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-background/65 px-3 py-2 text-sm outline-none focus:border-primary";
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold">{labels.authorId}<input required readOnly={Boolean(author)} name="authorId" defaultValue={author?.id ?? ""} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} className={`${input} read-only:opacity-60`}/></label>
      <label className="text-xs font-semibold">{labels.name}<input required name="name" defaultValue={author?.name ?? ""} maxLength={160} className={input}/></label>
      <label className="text-xs font-semibold">{labels.handle}<input name="handle" defaultValue={author?.handle ?? ""} maxLength={160} placeholder="@handle" className={input}/></label>
      <label className="text-xs font-semibold">{labels.icon}<input required name="icon" defaultValue={author?.icon ?? "person"} pattern="[a-z0-9_]+" maxLength={80} className={input}/></label>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold">{labels.category}<select required name="category" defaultValue={author?.category ?? "design"} className={input}>{authorCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-xs font-semibold">{labels.glow}<select required name="glowClass" defaultValue={author?.glow_class ?? authorGlowClasses[0]} className={input}>{authorGlowClasses.map((item, index) => <option key={item} value={item}>{labels[`glow${index + 1}`]}</option>)}</select></label>
      <label className="text-xs font-semibold">{labels.website}<input name="websiteUrl" type="url" defaultValue={author?.website_url ?? ""} placeholder="https://" className={input}/></label>
      <label className="text-xs font-semibold">{labels.avatar}<input name="avatarUrl" type="url" defaultValue={author?.avatar_url ?? ""} placeholder="https://" className={input}/></label>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <fieldset className="space-y-4 rounded-2xl border border-outline-variant/40 p-4"><legend className="px-2 text-xs font-semibold">English</legend><label className="block text-xs font-semibold">{labels.bio}<textarea required name="bioEn" defaultValue={author?.bio_en ?? ""} rows={4} maxLength={1000} className={input}/></label><label className="block text-xs font-semibold">{labels.focus}<textarea required name="focusEn" defaultValue={author?.focus_en.join(", ") ?? ""} rows={2} className={input}/></label></fieldset>
      <fieldset className="space-y-4 rounded-2xl border border-outline-variant/40 p-4"><legend className="px-2 text-xs font-semibold">Tiếng Việt</legend><label className="block text-xs font-semibold">{labels.bio}<textarea required name="bioVi" defaultValue={author?.bio_vi ?? ""} rows={4} maxLength={1000} className={input}/></label><label className="block text-xs font-semibold">{labels.focus}<textarea required name="focusVi" defaultValue={author?.focus_vi.join(", ") ?? ""} rows={2} className={input}/></label></fieldset>
    </div>
  </div>;
}

function ExistingAuthor({author, labels}: {author: PlatformAuthor; labels: Labels}) {
  const [updateState, updateAction] = useActionState(updatePlatformAuthor, initialState);
  const [publishState, publishAction] = useActionState(setPlatformAuthorPublished, initialState);
  const [deleteState, deleteAction] = useActionState(deletePlatformAuthor, initialState);
  return <AdminDisclosure title={author.name} meta={`${author.id} · ${author.skill_count} ${labels.skills}`} icon={author.icon} badge={<span className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${author.verified ? "bg-tertiary/12 text-tertiary" : "bg-secondary/12 text-secondary"}`}>{author.verified ? labels.published : labels.draft}</span>}>
    <div className="rounded-3xl border border-outline-variant/45 bg-surface-container-low/55 p-5 sm:p-7">
      <form action={updateAction}><AuthorFields author={author} labels={labels}/><div className="mt-5 flex justify-end"><Submit idle={labels.save} pending={labels.saving} variant="secondary"/></div><Status state={updateState} labels={labels}/></form>
      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-outline-variant/40 pt-5">
        <form action={deleteAction} onSubmit={(event) => {if (!window.confirm(labels.confirmDelete)) event.preventDefault();}}><input type="hidden" name="authorId" value={author.id}/><Submit idle={labels.delete} pending={labels.deleting} variant="danger"/><Status state={deleteState} labels={labels}/></form>
        {!author.verified && <form action={publishAction}><input type="hidden" name="authorId" value={author.id}/><input type="hidden" name="published" value="true"/><Submit idle={labels.publish} pending={labels.publishing}/><Status state={publishState} labels={labels}/></form>}
      </div>
    </div>
  </AdminDisclosure>;
}

export default function AdminAuthorManager({authors, labels}: {authors: PlatformAuthor[]; labels: Labels}) {
  const [createState, createAction] = useActionState(createPlatformAuthor, initialState);
  return <>
    <section className="rounded-3xl border border-outline-variant/45 bg-surface-container-low/55 p-5 sm:p-7"><h2 className="font-geist text-2xl font-bold">{labels.createTitle}</h2><p className="mt-2 text-sm text-on-surface-variant">{labels.createDescription}</p><form action={createAction} className="mt-6"><AuthorFields labels={labels}/><div className="mt-5 flex justify-end"><Submit idle={labels.create} pending={labels.creating}/></div><Status state={createState} labels={labels}/></form></section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{labels.libraryEyebrow}</p><h2 className="mt-2 font-geist text-2xl font-bold">{labels.libraryTitle}</h2></div><span className="font-mono text-xs text-on-surface-variant">{authors.length}</span></div><div className="space-y-3">{authors.map((author) => <ExistingAuthor key={author.id} author={author} labels={labels}/>)}</div></section>
  </>;
}
