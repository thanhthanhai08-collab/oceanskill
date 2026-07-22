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
const authorIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "platform_admin_required") return "forbidden";
  if (message.startsWith("gemini_") || message.startsWith("invalid_") || message.startsWith("platform_skill_") || ["skill_slug_owned_by_user"].includes(message)) return message;
  return "operation_failed";
}

function detailGroup(formData: FormData, locale: "En" | "Vi") {
  const values = {
    headline: clean(formData.get(`detailHeadline${locale}`)),
    overview: clean(formData.get(`detailOverview${locale}`)),
    featureOneTitle: clean(formData.get(`detailFeatureOneTitle${locale}`)),
    featureOneDescription: clean(formData.get(`detailFeatureOneDescription${locale}`)),
    featureTwoTitle: clean(formData.get(`detailFeatureTwoTitle${locale}`)),
    featureTwoDescription: clean(formData.get(`detailFeatureTwoDescription${locale}`)),
  };
  const lengths = Object.values(values).map((value) => value.length);
  if (lengths.every((length) => length === 0)) return values;
  if (!lengths.every((length) => length > 0)
    || values.headline.length > 180 || values.overview.length > 1200
    || values.featureOneTitle.length > 120 || values.featureTwoTitle.length > 120
    || values.featureOneDescription.length > 600 || values.featureTwoDescription.length > 600
  ) throw new Error("invalid_skill_details");
  return values;
}

function faqFields(formData: FormData) {
  const result: Record<string, string | boolean> = {faqs_touched: true};
  for (const locale of ["En", "Vi"] as const) {
    for (const order of [1, 2, 3] as const) {
      const question = clean(formData.get(`faqQuestion${locale}${order}`));
      const answer = clean(formData.get(`faqAnswer${locale}${order}`));
      if (Boolean(question) !== Boolean(answer) || question.length > 300 || answer.length > 1200) throw new Error("invalid_skill_faq");
      const dbLocale = locale.toLowerCase();
      result[`faq_question_${dbLocale}_${order}`] = question;
      result[`faq_answer_${dbLocale}_${order}`] = answer;
    }
  }
  return result;
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
    const authorId = clean(formData.get("authorId"));
    if (!authorIdPattern.test(authorId)) throw new Error("invalid_author_id");
    const detailsEn = detailGroup(formData, "En");
    const detailsVi = detailGroup(formData, "Vi");
    const faqs = faqFields(formData);
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
    const {data: author, error: authorError} = await admin.from("authors").select("id").eq("id", authorId).eq("verified", true).maybeSingle();
    if (authorError) throw authorError;
    if (!author) throw new Error("platform_skill_author_not_published");
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
      author_id: authorId,
      detail_headline_en: detailsEn.headline,
      detail_overview_en: detailsEn.overview,
      detail_feature_one_title_en: detailsEn.featureOneTitle,
      detail_feature_one_description_en: detailsEn.featureOneDescription,
      detail_feature_two_title_en: detailsEn.featureTwoTitle,
      detail_feature_two_description_en: detailsEn.featureTwoDescription,
      detail_headline_vi: detailsVi.headline,
      detail_overview_vi: detailsVi.overview,
      detail_feature_one_title_vi: detailsVi.featureOneTitle,
      detail_feature_one_description_vi: detailsVi.featureOneDescription,
      detail_feature_two_title_vi: detailsVi.featureTwoTitle,
      detail_feature_two_description_vi: detailsVi.featureTwoDescription,
      ...faqs,
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
