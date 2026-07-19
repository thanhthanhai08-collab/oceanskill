"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {requirePlatformAdmin} from "@/lib/admin/auth";
import {blogCoverBucket} from "@/lib/blog/covers";
import {createAdminClient} from "@/lib/supabase/admin";
import type {AdminContentState} from "../collections/actions";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const coverPathPattern = /^blog\/[a-z0-9][a-z0-9._-]{2,500}$/;
const maxCoverBytes = 5 * 1024 * 1024;
const clean = (value: FormDataEntryValue | null) => typeof value === "string" ? value.trim() : "";
const fail = (error: unknown): AdminContentState => ({status: "error", message: error instanceof Error ? error.message : "operation_failed"});

function detectImage(bytes: Uint8Array): {mime: string; extension: string} | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return {mime: "image/jpeg", extension: "jpg"};
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return {mime: "image/png", extension: "png"};
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return {mime: "image/webp", extension: "webp"};
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return {mime: "image/avif", extension: "avif"};
  return null;
}

async function verifyExistingCover(path: string) {
  if (!coverPathPattern.test(path)) throw new Error("invalid_blog_cover_path");
  const name = path.slice("blog/".length);
  const {data, error} = await createAdminClient().storage.from(blogCoverBucket).list("blog", {search: name, limit: 10});
  if (error) throw error;
  if (!(data ?? []).some((file) => file.id && file.name === name)) throw new Error("blog_cover_not_found");
}

async function resolveCover(fd: FormData, postSlug: string) {
  const selectedPath = clean(fd.get("coverImagePath"));
  const upload = fd.get("coverFile");
  if (!(upload instanceof File) || upload.size === 0) {
    if (!selectedPath) return {path: null, uploadedPath: null};
    await verifyExistingCover(selectedPath);
    return {path: selectedPath, uploadedPath: null};
  }
  if (upload.size > maxCoverBytes) throw new Error("blog_cover_too_large");
  const bytes = new Uint8Array(await upload.arrayBuffer());
  const detected = detectImage(bytes);
  if (!detected || upload.type !== detected.mime) throw new Error("invalid_blog_cover_file");
  const path = `blog/${postSlug}-${crypto.randomUUID()}.${detected.extension}`;
  const {error} = await createAdminClient().storage.from(blogCoverBucket).upload(path, bytes, {contentType: detected.mime, upsert: false});
  if (error) throw error;
  return {path, uploadedPath: path};
}

export async function saveBlogDraft(_previous: AdminContentState, fd: FormData): Promise<AdminContentState> {
  let uploadedPath: string | null = null;
  try {
    const actor = await requirePlatformAdmin();
    const id = clean(fd.get("draftId"));
    const postSlug = clean(fd.get("slug"));
    if (!slugPattern.test(postSlug)) throw new Error("invalid_blog_slug");
    const cover = await resolveCover(fd, postSlug);
    uploadedPath = cover.uploadedPath;
    const data = {
      published_slug: clean(fd.get("publishedSlug")) || null,
      slug: postSlug,
      title_en: clean(fd.get("titleEn")), title_vi: clean(fd.get("titleVi")),
      excerpt_en: clean(fd.get("excerptEn")), excerpt_vi: clean(fd.get("excerptVi")),
      content_en: clean(fd.get("contentEn")), content_vi: clean(fd.get("contentVi")),
      category: clean(fd.get("category")) || "Guide",
      author_name: clean(fd.get("authorName")) || "OceanSkill",
      icon: "article",
      reading_minutes: Number(clean(fd.get("readingMinutes")) || 5),
      cover_image_path: cover.path,
      created_by: actor.id,
      status: "review",
    };
    if (!data.title_en || !data.title_vi || !data.content_en || !data.content_vi || !Number.isInteger(data.reading_minutes) || data.reading_minutes < 1 || data.reading_minutes > 180) throw new Error("invalid_blog_post");
    const admin = createAdminClient();
    const result = id ? await admin.from("blog_post_drafts").update(data).eq("id", id).eq("status", "review") : await admin.from("blog_post_drafts").insert(data);
    if (result.error) throw result.error;
    revalidatePath(`/${await getLocale()}/admin/blog`);
    return {status: "success"};
  } catch (error) {
    if (uploadedPath) await createAdminClient().storage.from(blogCoverBucket).remove([uploadedPath]);
    return fail(error);
  }
}

export async function publishBlogDraft(_previous: AdminContentState, fd: FormData): Promise<AdminContentState> {
  try {
    const actor = await requirePlatformAdmin();
    const {error} = await createAdminClient().rpc("publish_blog_post_draft", {p_draft_id: clean(fd.get("draftId")), p_actor_id: actor.id});
    if (error) throw error;
    const locale = await getLocale(); revalidatePath(`/${locale}/admin/blog`); revalidatePath(`/${locale}/blog`);
    return {status: "success"};
  } catch (error) { return fail(error); }
}

export async function deleteBlogDraft(_previous: AdminContentState, fd: FormData): Promise<AdminContentState> {
  try {
    await requirePlatformAdmin();
    const {error} = await createAdminClient().from("blog_post_drafts").delete().eq("id", clean(fd.get("draftId"))).eq("status", "review");
    if (error) throw error; revalidatePath(`/${await getLocale()}/admin/blog`); return {status: "success"};
  } catch (error) { return fail(error); }
}

export async function deletePublishedBlog(_previous: AdminContentState, fd: FormData): Promise<AdminContentState> {
  try {
    await requirePlatformAdmin();
    const {error} = await createAdminClient().from("blog_posts").delete().eq("slug", clean(fd.get("slug")));
    if (error) throw error;
    const locale = await getLocale(); revalidatePath(`/${locale}/admin/blog`); revalidatePath(`/${locale}/blog`); return {status: "success"};
  } catch (error) { return fail(error); }
}
