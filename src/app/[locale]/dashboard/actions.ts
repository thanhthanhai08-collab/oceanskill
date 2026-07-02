"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {parsePrivateSkillForm, scanSkillContent} from "@/lib/skills/validation";

export type CreateSkillState = Readonly<{status: "idle" | "success" | "error"; message?: string; checks?: Array<{id: string; passed: boolean; message: string}>}>;

export async function createPrivateSkill(_previous: CreateSkillState, formData: FormData): Promise<CreateSkillState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return {status: "error", message: "unauthorized"};
  try {
    const input = parsePrivateSkillForm(formData);
    const scan = scanSkillContent(input.content);
    if (!scan.passed) return {status: "error", message: "scan_failed", checks: scan.checks};
    const {data: skill, error: skillError} = await supabase.from("skills").insert({
      owner_id: String(userId), visibility: "private", status: "draft", slug: input.slug,
      title: input.title, description: input.description, domain: input.domain,
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

export async function logout() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}`);
}
