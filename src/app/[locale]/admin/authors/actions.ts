"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {requirePlatformAdmin} from "@/lib/admin/auth";
import {createAdminClient} from "@/lib/supabase/admin";
import {authorCategories, authorGlowClasses} from "@/lib/skills/platform-author-schema";

export type AdminAuthorActionState = Readonly<{status: "idle" | "success" | "error"; message?: string}>;

const authorIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const iconPattern = /^[a-z0-9_]{1,80}$/;

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function focus(value: FormDataEntryValue | null) {
  return [...new Set(clean(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean))].slice(0, 8);
}

function parseAuthor(formData: FormData) {
  const id = clean(formData.get("authorId")).toLowerCase();
  const name = clean(formData.get("name"));
  const handle = clean(formData.get("handle"));
  const icon = clean(formData.get("icon")) || "person";
  const category = clean(formData.get("category"));
  const glowClass = clean(formData.get("glowClass"));
  const websiteUrl = clean(formData.get("websiteUrl"));
  const avatarUrl = clean(formData.get("avatarUrl"));
  const bioEn = clean(formData.get("bioEn"));
  const bioVi = clean(formData.get("bioVi"));
  const focusEn = focus(formData.get("focusEn"));
  const focusVi = focus(formData.get("focusVi"));

  if (!authorIdPattern.test(id) || id.length > 100) throw new Error("invalid_author_id");
  if (name.length < 1 || name.length > 160) throw new Error("invalid_author_name");
  if (handle.length > 160 || !iconPattern.test(icon)) throw new Error("invalid_author_metadata");
  if (!(authorCategories as readonly string[]).includes(category)) throw new Error("invalid_author_category");
  if (!(authorGlowClasses as readonly string[]).includes(glowClass)) throw new Error("invalid_author_glow");
  for (const url of [websiteUrl, avatarUrl]) {
    if (url && (!URL.canParse(url) || !url.startsWith("https://"))) throw new Error("invalid_author_url");
  }
  if (bioEn.length < 1 || bioEn.length > 1000 || bioVi.length < 1 || bioVi.length > 1000) throw new Error("invalid_author_bio");
  if (!focusEn.length || !focusVi.length) throw new Error("invalid_author_focus");
  return {id, name, handle, icon, category, glowClass, websiteUrl: websiteUrl || null, avatarUrl: avatarUrl || null, bioEn, bioVi, focusEn, focusVi};
}

function publicError(error: unknown) {
  const row = error && typeof error === "object" ? error as {code?: string; message?: string} : null;
  const message = error instanceof Error ? error.message : row?.message ?? "operation_failed";
  if (row?.code === "23505" || message.includes("duplicate key")) return "author_id_exists";
  return message.startsWith("invalid_") || message === "author_in_use" || message === "author_not_found" ? message : "operation_failed";
}

async function revalidateAdminAuthors() {
  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/authors`);
  revalidatePath(`/${locale}/authors`, "layout");
  revalidatePath(`/${locale}/skills`, "layout");
}

export async function createPlatformAuthor(_previous: AdminAuthorActionState, formData: FormData): Promise<AdminAuthorActionState> {
  try {
    await requirePlatformAdmin();
    const input = parseAuthor(formData);
    const admin = createAdminClient();
    const {error} = await admin.from("authors").insert({
      id: input.id, name: input.name, handle: input.handle, icon: input.icon,
      category: input.category, domain: input.category, glow_class: input.glowClass,
      website_url: input.websiteUrl, avatar_url: input.avatarUrl,
      bio: input.bioEn, focus: input.focusEn, verified: false,
    });
    if (error) throw error;
    const {error: translationError} = await admin.from("author_translations").insert([
      {author_id: input.id, locale: "en", bio: input.bioEn, focus: input.focusEn},
      {author_id: input.id, locale: "vi", bio: input.bioVi, focus: input.focusVi},
    ]);
    if (translationError) {
      await admin.from("authors").delete().eq("id", input.id);
      throw translationError;
    }
    await revalidateAdminAuthors();
    return {status: "success", message: "author_created"};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}

export async function updatePlatformAuthor(_previous: AdminAuthorActionState, formData: FormData): Promise<AdminAuthorActionState> {
  try {
    await requirePlatformAdmin();
    const input = parseAuthor(formData);
    const admin = createAdminClient();
    const {data, error} = await admin.from("authors").update({
      name: input.name, handle: input.handle, icon: input.icon,
      category: input.category, domain: input.category, glow_class: input.glowClass,
      website_url: input.websiteUrl, avatar_url: input.avatarUrl,
      bio: input.bioEn, focus: input.focusEn,
    }).eq("id", input.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("author_not_found");
    const {error: translationError} = await admin.from("author_translations").upsert([
      {author_id: input.id, locale: "en", bio: input.bioEn, focus: input.focusEn, updated_at: new Date().toISOString()},
      {author_id: input.id, locale: "vi", bio: input.bioVi, focus: input.focusVi, updated_at: new Date().toISOString()},
    ], {onConflict: "author_id,locale"});
    if (translationError) throw translationError;
    await revalidateAdminAuthors();
    return {status: "success", message: "author_updated"};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}

export async function setPlatformAuthorPublished(_previous: AdminAuthorActionState, formData: FormData): Promise<AdminAuthorActionState> {
  try {
    await requirePlatformAdmin();
    const authorId = clean(formData.get("authorId"));
    const published = clean(formData.get("published")) === "true";
    if (!authorIdPattern.test(authorId)) throw new Error("invalid_author_id");
    const admin = createAdminClient();
    if (published) {
      const {data: translations, error: translationError} = await admin.from("author_translations").select("locale,bio,focus").eq("author_id", authorId).in("locale", ["en", "vi"]);
      if (translationError) throw translationError;
      if (!["en", "vi"].every((locale) => translations?.some((row) => row.locale === locale && row.bio.trim() && row.focus.length))) throw new Error("invalid_author_translations");
    } else {
      const {count, error: countError} = await admin.from("skills").select("id", {count: "exact", head: true}).eq("author_id", authorId).eq("visibility", "public").eq("status", "active");
      if (countError) throw countError;
      if ((count ?? 0) > 0) throw new Error("author_in_use");
    }
    const {data, error} = await admin.from("authors").update({verified: published}).eq("id", authorId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("author_not_found");
    await revalidateAdminAuthors();
    return {status: "success", message: published ? "author_published" : "author_unpublished"};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}

export async function deletePlatformAuthor(_previous: AdminAuthorActionState, formData: FormData): Promise<AdminAuthorActionState> {
  try {
    await requirePlatformAdmin();
    const authorId = clean(formData.get("authorId"));
    if (!authorIdPattern.test(authorId)) throw new Error("invalid_author_id");
    const admin = createAdminClient();
    const [{count: skillCount, error: skillCountError}, {count: draftCount, error: draftCountError}] = await Promise.all([
      admin.from("skills").select("id", {count: "exact", head: true}).eq("author_id", authorId),
      admin.from("platform_skill_drafts").select("id", {count: "exact", head: true}).eq("author_id", authorId),
    ]);
    if (skillCountError || draftCountError) throw (skillCountError ?? draftCountError);
    if ((skillCount ?? 0) > 0 || (draftCount ?? 0) > 0) throw new Error("author_in_use");
    const {data, error} = await admin.from("authors").delete().eq("id", authorId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("author_not_found");
    await revalidateAdminAuthors();
    return {status: "success", message: "author_deleted"};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}
