"use server";

import {revalidatePath} from "next/cache";
import {getLocale} from "next-intl/server";
import {requirePlatformAdmin} from "@/lib/admin/auth";
import {createAdminClient} from "@/lib/supabase/admin";
import {analyzeSkillMetadataWithGemini, validateGeminiSkillMetadata, type GeminiSkillMetadata} from "@/lib/skills/gemini-metadata";
import {parsePrivateSkillPackage} from "@/lib/skills/package";
import {createPlatformSkillDraft} from "@/lib/skills/platform-publishing";
import {scanSkillContent} from "@/lib/skills/validation";

export type AdminSkillActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  draftId?: string;
  checks?: Array<{id: string; passed: boolean; message: string}>;
}>;

const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "platform_admin_required") return "forbidden";
  if (message.startsWith("gemini_") || message.startsWith("invalid_") || ["skill_slug_owned_by_user", "platform_skill_version_exists"].includes(message)) return message;
  return "operation_failed";
}

export async function savePlatformSkillDraft(_previous: AdminSkillActionState, formData: FormData): Promise<AdminSkillActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const skillName = clean(formData.get("skillName"));
    const version = clean(formData.get("version"));
    if (skillName.length < 2 || skillName.length > 160) throw new Error("invalid_skill_name");
    if (!semver.test(version)) throw new Error("invalid_version");

    const bundle = await parsePrivateSkillPackage(formData.get("bundle"));
    if (!bundle) throw new Error("invalid_bundle_required");
    const scan = scanSkillContent(bundle.skillMd);
    const checks = [...scan.checks, ...bundle.checks];
    if (!scan.passed) return {status: "error", message: "scan_failed", checks};

    let metadata: GeminiSkillMetadata;
    let metadataSource: "gemini" | "manual_required" = "gemini";
    let geminiError: string | null = null;
    try {
      metadata = await analyzeSkillMetadataWithGemini({skillName, version, skillMd: bundle.skillMd});
    } catch (error) {
      metadataSource = "manual_required";
      geminiError = (error instanceof Error ? error.message : "gemini_unavailable").slice(0, 160);
      metadata = {titleEn: "", titleVi: "", descriptionEn: "", descriptionVi: "", category: "productivity" as const, compatibleClients: [], licenseSpdx: null, sourceUrl: null, tags: []};
    }
    const result = await createPlatformSkillDraft({adminId: admin.id, skillName, version, bundle, scan, metadata, metadataSource, geminiError});
    const locale = await getLocale();
    revalidatePath(`/${locale}/admin/skills`);
    return {status: "success", message: metadataSource === "manual_required" ? "draft_saved_manual" : "draft_saved", draftId: result.draftId, checks: result.checks};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}

export async function updatePlatformSkillDraft(_previous: AdminSkillActionState, formData: FormData): Promise<AdminSkillActionState> {
  try {
    await requirePlatformAdmin();
    const draftId = clean(formData.get("draftId"));
    if (!uuid.test(draftId)) throw new Error("invalid_draft_id");
    const metadata = validateGeminiSkillMetadata({
      titleEn: clean(formData.get("titleEn")),
      titleVi: clean(formData.get("titleVi")),
      descriptionEn: clean(formData.get("descriptionEn")),
      descriptionVi: clean(formData.get("descriptionVi")),
      category: clean(formData.get("category")),
      compatibleClients: formData.getAll("compatibleClients").map(String),
      licenseSpdx: clean(formData.get("licenseSpdx")) || null,
      sourceUrl: clean(formData.get("sourceUrl")) || null,
      tags: formData.getAll("tags").map(String),
    });
    const admin = createAdminClient();
    const {data, error} = await admin.from("platform_skill_drafts").update({
      title_en: metadata.titleEn,
      title_vi: metadata.titleVi,
      description_en: metadata.descriptionEn,
      description_vi: metadata.descriptionVi,
      category: metadata.category,
      compatible_clients: metadata.compatibleClients,
      source_url: metadata.sourceUrl,
      license_spdx: metadata.licenseSpdx,
      tags: metadata.tags,
      metadata_source: "manual",
      gemini_error: null,
    }).eq("id", draftId).eq("status", "review").select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("draft_not_reviewable");
    const locale = await getLocale();
    revalidatePath(`/${locale}/admin/skills`);
    return {status: "success", message: "draft_updated", draftId};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}

export async function publishPlatformSkillDraft(_previous: AdminSkillActionState, formData: FormData): Promise<AdminSkillActionState> {
  try {
    const platformAdmin = await requirePlatformAdmin();
    const draftId = clean(formData.get("draftId"));
    if (!uuid.test(draftId)) throw new Error("invalid_draft_id");
    const admin = createAdminClient();
    const {error} = await admin.rpc("publish_platform_skill_draft", {p_draft_id: draftId, p_actor_id: platformAdmin.id});
    if (error) throw error;
    const locale = await getLocale();
    revalidatePath(`/${locale}/admin/skills`);
    revalidatePath(`/${locale}/skills`, "layout");
    revalidatePath(`/${locale}`);
    return {status: "success", message: "published", draftId};
  } catch (error) {
    return {status: "error", message: publicError(error)};
  }
}
