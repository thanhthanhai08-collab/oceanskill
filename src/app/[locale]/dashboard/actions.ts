"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {parsePrivateSkillForm, scanSkillContent} from "@/lib/skills/validation";

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
    const scan = scanSkillContent(input.content);
    if (!scan.passed) return {status: "error", message: "scan_failed", checks: scan.checks};
    const {data: skill, error: skillError} = await supabase.from("skills").insert({
      owner_id: String(userId), visibility: "private", status: "draft", slug: input.slug,
      title: input.title, description: input.description, category: input.category,
      compatible_clients: input.compatibleClients, source_url: input.sourceUrl, license_spdx: input.licenseSpdx,
    }).select("id").single();
    if (skillError) throw skillError;
    const {error: versionError} = await supabase.from("skill_versions").insert({
      skill_id: skill.id, version: input.version, content_md: input.content, content_hash: scan.contentHash,
      scan_status: "passed", scan_summary: {pipeline: "creator-private-v1", checks: scan.checks},
    });
    if (versionError) {
      await supabase.from("skills").update({status: "archived"}).eq("id", skill.id);
      throw versionError;
    }
    const {error: activateError} = await supabase.from("skills").update({status: "active", current_version: input.version}).eq("id", skill.id);
    if (activateError) throw activateError;
    revalidatePath(`/${locale}/dashboard/skills`);
    return {status: "success", message: "created", checks: scan.checks};
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
