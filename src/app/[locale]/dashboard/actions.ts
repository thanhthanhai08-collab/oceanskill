"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {parsePrivateSkillForm, scanSkillContent} from "@/lib/skills/validation";
import {parsePrivateSkillPackage} from "@/lib/skills/package";

export type CreateSkillState = Readonly<{status: "idle" | "success" | "error"; message?: string; checks?: Array<{id: string; passed: boolean; message: string}>}>;
export type AvatarUploadState = Readonly<{status: "idle" | "success" | "error"; message?: string; avatarUrl?: string}>;

const avatarTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function updateAvatar(_previous: AvatarUploadState, formData: FormData): Promise<AvatarUploadState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  if (!userId) return {status: "error", message: "unauthorized"};

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return {status: "error", message: "missing_file"};
  if (file.size > 2 * 1024 * 1024) return {status: "error", message: "file_too_large"};

  const extension = avatarTypes.get(file.type);
  if (!extension) return {status: "error", message: "invalid_file_type"};

  const path = `${userId}/${Date.now()}.${extension}`;
  const {error: uploadError} = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return {status: "error", message: uploadError.message};

  const {data: publicUrlData} = supabase.storage.from("avatars").getPublicUrl(path);
  const {error: updateError} = await supabase
    .from("profiles")
    .update({avatar_url: publicUrlData.publicUrl})
    .eq("id", userId);
  if (updateError) return {status: "error", message: updateError.message};

  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/dashboard`, "layout");
  revalidatePath(`/${locale}/dashboard/settings`);
  revalidatePath(`/${locale}/skills`, "layout");
  revalidatePath(`/${locale}/blog`, "layout");
  return {status: "success", message: "avatar_updated", avatarUrl: publicUrlData.publicUrl};
}

export async function createPrivateSkill(_previous: CreateSkillState, formData: FormData): Promise<CreateSkillState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return {status: "error", message: "unauthorized"};
  try {
    const [{count, error: countError}, {data: profile, error: profileError}] = await Promise.all([
      supabase.from("skills").select("id", {count: "exact", head: true}).eq("owner_id", String(userId)),
      supabase.from("profiles").select("creator_skill_limit").eq("id", String(userId)).maybeSingle(),
    ]);
    if (countError || profileError) throw countError ?? profileError;
    if ((count ?? 0) >= Number(profile?.creator_skill_limit ?? 5)) return {status: "error", message: "skill_limit_reached"};
    const input = parsePrivateSkillForm(formData);
    const bundle = await parsePrivateSkillPackage(formData.get("bundle"));
    const content = bundle?.skillMd ?? input.content;
    const scan = scanSkillContent(content);
    const checks = [...scan.checks, ...(bundle?.checks ?? [])];
    if (!scan.passed) return {status: "error", message: "scan_failed", checks};
    const {data: skill, error: skillError} = await supabase.from("skills").insert({
      owner_id: String(userId), visibility: "private", status: "draft", slug: input.slug,
      title: input.title, description: input.description, category: input.category,
      compatible_clients: input.compatibleClients, source_url: input.sourceUrl, license_spdx: input.licenseSpdx,
    }).select("id").single();
    if (skillError) throw skillError;
    const admin = createAdminClient();
    const skillMdBucket = "skill-artifacts";
    const skillMdPath = `skills/${skill.id}/${input.version}/SKILL.md`;
    const skillMdBytes = Buffer.from(content, "utf8");
    const uploadedPaths: string[] = [];
    const {error: uploadError} = await admin.storage.from(skillMdBucket).upload(skillMdPath, skillMdBytes, {
      contentType: "text/markdown; charset=utf-8",
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) {
      await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
      throw uploadError;
    }
    uploadedPaths.push(skillMdPath);
    for (const reference of bundle?.references ?? []) {
      const path = `skills/${skill.id}/${input.version}/${reference.referenceKey}`;
      const {error} = await admin.storage.from(skillMdBucket).upload(path, reference.bytes, {
        contentType: reference.mimeType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        await admin.storage.from(skillMdBucket).remove(uploadedPaths);
        await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
        throw error;
      }
      uploadedPaths.push(path);
    }
    const {data: versionRow, error: versionError} = await admin.from("skill_versions").insert({
      skill_id: skill.id, version: input.version, content_md: "",
      skill_md_bucket: skillMdBucket, skill_md_path: skillMdPath, skill_md_size_bytes: skillMdBytes.byteLength,
      skill_md_hash: scan.skillMdHash, skill_md_verified_at: new Date().toISOString(),
      scan_status: "passed", scan_summary: {pipeline: "creator-private-package-v2", referenceCount: bundle?.references.length ?? 0, checks},
    }).select("id").single();
    if (versionError) {
      await admin.storage.from(skillMdBucket).remove(uploadedPaths);
      await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
      throw versionError;
    }
    if (bundle?.references.length) {
      const verifiedAt = new Date().toISOString();
      const {error: referenceError} = await admin.from("skill_reference_files").insert(bundle.references.map((reference) => ({
        skill_version_id: versionRow.id,
        reference_key: reference.referenceKey,
        storage_bucket: skillMdBucket,
        storage_path: `skills/${skill.id}/${input.version}/${reference.referenceKey}`,
        display_name: reference.referenceKey.split("/").at(-1) ?? reference.referenceKey,
        mime_type: reference.mimeType,
        size_bytes: reference.bytes.byteLength,
        content_hash: reference.contentHash,
        verified_at: verifiedAt,
      })));
      if (referenceError) {
        await admin.from("skill_versions").delete().eq("id", versionRow.id);
        await admin.storage.from(skillMdBucket).remove(uploadedPaths);
        await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
        throw referenceError;
      }
    }
    const {error: activateError} = await supabase.from("skills").update({status: "active", current_version: input.version}).eq("id", skill.id);
    if (activateError) {
      await admin.from("skill_versions").delete().eq("skill_id", skill.id).eq("version", input.version);
      await admin.storage.from(skillMdBucket).remove(uploadedPaths);
      await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
      throw activateError;
    }
    revalidatePath(`/${locale}/dashboard/skills`);
    return {status: "success", message: "created", checks};
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith("invalid_") ? error.message : error instanceof Error && error.message === "missing_client" ? error.message : "create_failed";
    return {status: "error", message: code};
  }
}

export async function addPlatformSkill(formData: FormData) {
  const locale = await getLocale();
  const skillId = String(formData.get("skillId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(skillId)) return;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/${locale}/login?next=/${locale}/skills`);
  const {error} = await supabase.from("user_skill_library").insert({user_id: String(userId), skill_id: skillId});
  // Adding an existing skill is idempotent. Using INSERT also avoids requiring
  // UPDATE permission on a table where users are only allowed to add/remove rows.
  if (error && error.code !== "23505") throw new Error(`Could not add skill to library: ${error.message}`);
  revalidatePath(`/${locale}/dashboard/skills`);
  redirect(`/${locale}/dashboard/skills`);
}

export async function logout() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}`);
}
