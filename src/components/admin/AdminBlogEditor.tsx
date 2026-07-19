"use client";

import Image from "next/image";
import Link from "next/link";
import {useActionState, useState} from "react";
import {useFormStatus} from "react-dom";
import {deleteBlogDraft, deletePublishedBlog, publishBlogDraft, saveBlogDraft} from "@/app/[locale]/admin/blog/actions";
import type {AdminContentState} from "@/app/[locale]/admin/collections/actions";
import type {BlogCoverOption, BlogDraft, PublishedBlogAdmin} from "@/lib/admin/content";
import {blogCoverPublicUrl} from "@/lib/blog/covers";

const idle: AdminContentState = {status: "idle"};

function Button({children, danger = false}: {children: React.ReactNode; danger?: boolean}) {
  const {pending} = useFormStatus();
  return <button disabled={pending} className={danger ? "min-h-10 rounded-xl border border-error/40 px-4 text-sm font-semibold text-error" : "btn-payment min-h-10 rounded-xl px-4 text-sm font-semibold"}>{pending ? "…" : children}</button>;
}

export default function AdminBlogEditor({locale, covers, draft, post}: {locale: string; covers: BlogCoverOption[]; draft?: BlogDraft; post?: PublishedBlogAdmin}) {
  const [save, saveAction] = useActionState(saveBlogDraft, idle);
  const [publish, publishAction] = useActionState(publishBlogDraft, idle);
  const [remove, removeAction] = useActionState(draft ? deleteBlogDraft : deletePublishedBlog, idle);
  const initialCover = draft?.cover_image_path ?? post?.cover_image_path ?? "";
  const [coverPath, setCoverPath] = useState(initialCover);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const input = "mt-2 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-background/65 px-3 py-2 text-sm outline-none focus:border-primary";
  const coverUrl = localPreview ?? blogCoverPublicUrl(coverPath);
  const vi = locale === "vi";

  return <article className="rounded-3xl border border-outline-variant/45 bg-surface-container-low/55 p-5 sm:p-7">
    <div className="mb-5 flex items-center justify-between"><h2 className="font-geist text-xl font-bold">{draft?.slug ?? post?.slug ?? (vi ? "Bài mới" : "New post")}</h2>{draft && <span className="rounded-full bg-secondary/12 px-3 py-1 text-xs text-secondary">Draft</span>}</div>
    <form action={saveAction} className="space-y-5">
      <input type="hidden" name="draftId" value={draft?.id ?? ""}/><input type="hidden" name="publishedSlug" value={draft?.published_slug ?? post?.slug ?? ""}/>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="text-xs font-semibold md:col-span-2">Slug<input name="slug" required defaultValue={draft?.slug ?? post?.slug ?? ""} className={input}/></label>
        <label className="text-xs font-semibold">Category<input name="category" defaultValue={draft?.category ?? post?.category ?? "Guide"} className={input}/></label>
        <label className="text-xs font-semibold">Minutes<input name="readingMinutes" type="number" min="1" max="180" defaultValue={draft?.reading_minutes ?? post?.reading_minutes ?? 5} className={input}/></label>
        <label className="text-xs font-semibold md:col-span-2">Author<input name="authorName" defaultValue={draft?.author_name ?? post?.author_name ?? "OceanSkill"} className={input}/></label>
      </div>
      <fieldset className="rounded-2xl border border-outline-variant/35 p-4">
        <legend className="px-2 text-sm font-semibold">{vi ? "Ảnh bìa 16:9" : "16:9 cover image"}</legend>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div className="space-y-4">
            <label className="block text-xs font-semibold">{vi ? "Chọn ảnh trong Storage" : "Choose from Storage"}<select name="coverImagePath" value={coverPath} onChange={(event) => {setCoverPath(event.target.value); setLocalPreview(null);}} className={input}><option value="">{vi ? "Không dùng ảnh bìa" : "No cover image"}</option>{covers.map((cover) => <option key={cover.path} value={cover.path}>{cover.name}</option>)}</select></label>
            <label className="block text-xs font-semibold">{vi ? "Hoặc tải ảnh mới" : "Or upload a new image"}<input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary`} onChange={(event) => {const file = event.target.files?.[0]; setLocalPreview(file ? URL.createObjectURL(file) : null);}}/></label>
            <p className="text-xs leading-5 text-on-surface-variant">{vi ? "JPEG, PNG, WebP hoặc AVIF; tối đa 5 MB. Ảnh mới được lưu trong blog/ của bucket blog-assets." : "JPEG, PNG, WebP, or AVIF; maximum 5 MB. New files are stored under blog/ in the blog-assets bucket."}</p>
          </div>
          {coverUrl && <div className="relative aspect-video overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container"><Image src={coverUrl} alt="" fill sizes="420px" className="object-cover" unoptimized={Boolean(localPreview)}/></div>}
        </div>
      </fieldset>
      <div className="grid gap-4 lg:grid-cols-2">{(["En", "Vi"] as const).map((language) => <div key={language} className="space-y-4 rounded-2xl border border-outline-variant/35 p-4"><h3 className="font-semibold">{language === "En" ? "English" : "Tiếng Việt"}</h3><label className="text-xs font-semibold">Title<input name={`title${language}`} required defaultValue={language === "En" ? (draft?.title_en ?? post?.title_en) : (draft?.title_vi ?? post?.title_vi)} className={input}/></label><label className="text-xs font-semibold">Excerpt<textarea name={`excerpt${language}`} defaultValue={language === "En" ? (draft?.excerpt_en ?? post?.excerpt_en) : (draft?.excerpt_vi ?? post?.excerpt_vi)} rows={3} className={input}/></label><label className="text-xs font-semibold">Markdown<textarea name={`content${language}`} required defaultValue={language === "En" ? (draft?.content_en ?? post?.content_en) : (draft?.content_vi ?? post?.content_vi)} rows={16} className={`${input} font-mono`}/></label></div>)}</div>
      <p className="text-xs text-on-surface-variant">## h2 · ### h3 · #### h4 · [link](https://…) · Markdown table · blank line / line break</p>
      {save.status !== "idle" && <p className={save.status === "success" ? "text-sm text-tertiary" : "text-sm text-error"}>{save.status === "success" ? (vi ? "Đã lưu bản nháp." : "Draft saved.") : save.message}</p>}
      <div className="flex justify-end"><Button>{vi ? "Lưu bản nháp" : "Save draft"}</Button></div>
    </form>
    {(draft || post) && <div className="mt-4 flex flex-wrap gap-3 border-t border-outline-variant/35 pt-4">{draft && <><Link href={`/${locale}/admin/blog/${draft.id}/preview`} className="min-h-10 rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary">{vi ? "Xem trước như production" : "Production preview"}</Link><form action={publishAction}><input type="hidden" name="draftId" value={draft.id}/><Button>{vi ? "Đăng bài" : "Publish"}</Button></form></>}<form action={removeAction} className="ml-auto"><input type="hidden" name={draft ? "draftId" : "slug"} value={draft?.id ?? post?.slug}/><Button danger>{vi ? "Xóa" : "Delete"}</Button></form>{(publish.status === "error" || remove.status === "error") && <p className="w-full text-sm text-error">{publish.message ?? remove.message}</p>}</div>}
  </article>;
}
