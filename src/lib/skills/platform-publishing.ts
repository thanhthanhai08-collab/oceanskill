import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import type {PrivateSkillPackage} from "@/lib/skills/package";
import type {SkillScan} from "@/lib/skills/validation";
import type {GeminiSkillMetadata} from "@/lib/skills/gemini-metadata";
import {geminiMetadataModel} from "@/lib/skills/gemini-metadata";

const artifactBucket = "skill-artifacts";

export function slugifyPlatformSkillName(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function createPlatformSkillDraft(input: {
  adminId: string;
  skillName: string;
  version: string;
  bundle: PrivateSkillPackage;
  scan: SkillScan;
  metadata: GeminiSkillMetadata;
  metadataSource?: "gemini" | "manual_required";
  geminiError?: string | null;
}) {
  const admin = createAdminClient();
  const slug = slugifyPlatformSkillName(input.skillName);
  if (!slug || slug.length > 100) throw new Error("invalid_slug");

  const {data: existingSkill, error: lookupError} = await admin.from("skills")
    .select("id,owner_id,author_id")
    .eq("slug", slug)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existingSkill?.owner_id) throw new Error("skill_slug_owned_by_user");

  let skillId = existingSkill?.id as string | undefined;
  let createdSkill = false;
  const uploadedPaths: string[] = [];
  let versionId: string | null = null;

  try {
    if (!skillId) {
      const {data: skill, error} = await admin.from("skills").insert({
        slug,
        title: input.metadata.titleEn || input.skillName,
        description: input.metadata.descriptionEn || "Pending manual metadata review.",
        category: input.metadata.category,
        status: "draft",
        visibility: "private",
        owner_id: null,
        compatible_clients: input.metadata.compatibleClients.length ? input.metadata.compatibleClients : ["codex"],
        source_url: input.metadata.sourceUrl,
        license_spdx: input.metadata.licenseSpdx,
      }).select("id").single();
      if (error) throw error;
      skillId = String(skill.id);
      createdSkill = true;
    }

    const {data: duplicateVersion, error: versionLookupError} = await admin.from("skill_versions")
      .select("id")
      .eq("skill_id", skillId)
      .eq("version", input.version)
      .maybeSingle();
    if (versionLookupError) throw versionLookupError;
    if (duplicateVersion) throw new Error("platform_skill_version_exists");

    const versionPrefix = `${slug}/${input.version}`;
    const skillMdPath = `${versionPrefix}/SKILL.md`;
    const skillMdBytes = Buffer.from(input.bundle.skillMd, "utf8");
    const {error: skillMdUploadError} = await admin.storage.from(artifactBucket).upload(skillMdPath, skillMdBytes, {
      contentType: "text/markdown",
      cacheControl: "31536000",
      upsert: false,
    });
    if (skillMdUploadError) throw skillMdUploadError;
    uploadedPaths.push(skillMdPath);

    for (const reference of input.bundle.references) {
      const path = `${versionPrefix}/${reference.referenceKey}`;
      const {error} = await admin.storage.from(artifactBucket).upload(path, reference.bytes, {
        contentType: reference.mimeType.split(";")[0],
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      uploadedPaths.push(path);
    }

    const checks = [...input.scan.checks, ...input.bundle.checks];
    const {data: version, error: versionError} = await admin.from("skill_versions").insert({
      skill_id: skillId,
      version: input.version,
      content_md: "",
      skill_md_bucket: artifactBucket,
      skill_md_path: skillMdPath,
      skill_md_size_bytes: skillMdBytes.byteLength,
      skill_md_hash: input.scan.skillMdHash,
      skill_md_verified_at: new Date().toISOString(),
      scan_status: "passed",
      scan_summary: {pipeline: "admin-platform-package-v1", referenceCount: input.bundle.references.length, checks, metadataModel: geminiMetadataModel},
    }).select("id").single();
    if (versionError) throw versionError;
    versionId = String(version.id);

    if (input.bundle.references.length) {
      const verifiedAt = new Date().toISOString();
      const {error} = await admin.from("skill_reference_files").insert(input.bundle.references.map((reference) => ({
        skill_version_id: versionId,
        reference_key: reference.referenceKey,
        storage_bucket: artifactBucket,
        storage_path: `${versionPrefix}/${reference.referenceKey}`,
        display_name: reference.referenceKey.split("/").at(-1) ?? reference.referenceKey,
        mime_type: reference.mimeType,
        size_bytes: reference.bytes.byteLength,
        content_hash: reference.contentHash,
        verified_at: verifiedAt,
      })));
      if (error) throw error;
    }

    const {data: existingDetails, error: detailsError} = await admin.from("skill_details")
      .select("locale,headline,overview,feature_one_title,feature_one_description,feature_two_title,feature_two_description")
      .eq("skill_id", skillId)
      .in("locale", ["en", "vi"]);
    if (detailsError) throw detailsError;
    const {data: existingFaqs, error: faqsError} = await admin.from("skill_faqs")
      .select("locale,question,answer,sort_order")
      .eq("skill_id", skillId)
      .in("locale", ["en", "vi"])
      .order("sort_order");
    if (faqsError) throw faqsError;
    const detailEn = existingDetails?.find((detail) => detail.locale === "en");
    const detailVi = existingDetails?.find((detail) => detail.locale === "vi");
    const faq = (locale: "en" | "vi", order: number) => existingFaqs?.find((item) => item.locale === locale && item.sort_order === order);

    const {data: draft, error: draftError} = await admin.from("platform_skill_drafts").insert({
      skill_id: skillId,
      skill_version_id: versionId,
      version: input.version,
      title_en: input.metadata.titleEn,
      title_vi: input.metadata.titleVi,
      description_en: input.metadata.descriptionEn,
      description_vi: input.metadata.descriptionVi,
      category: input.metadata.category,
      compatible_clients: input.metadata.compatibleClients,
      source_url: input.metadata.sourceUrl,
      license_spdx: input.metadata.licenseSpdx,
      tags: input.metadata.tags,
      author_id: existingSkill?.author_id ?? null,
      detail_headline_en: detailEn?.headline ?? "",
      detail_overview_en: detailEn?.overview ?? "",
      detail_feature_one_title_en: detailEn?.feature_one_title ?? "",
      detail_feature_one_description_en: detailEn?.feature_one_description ?? "",
      detail_feature_two_title_en: detailEn?.feature_two_title ?? "",
      detail_feature_two_description_en: detailEn?.feature_two_description ?? "",
      detail_headline_vi: detailVi?.headline ?? "",
      detail_overview_vi: detailVi?.overview ?? "",
      detail_feature_one_title_vi: detailVi?.feature_one_title ?? "",
      detail_feature_one_description_vi: detailVi?.feature_one_description ?? "",
      detail_feature_two_title_vi: detailVi?.feature_two_title ?? "",
      detail_feature_two_description_vi: detailVi?.feature_two_description ?? "",
      faq_question_en_1: faq("en", 1)?.question ?? "",
      faq_answer_en_1: faq("en", 1)?.answer ?? "",
      faq_question_en_2: faq("en", 2)?.question ?? "",
      faq_answer_en_2: faq("en", 2)?.answer ?? "",
      faq_question_en_3: faq("en", 3)?.question ?? "",
      faq_answer_en_3: faq("en", 3)?.answer ?? "",
      faq_question_vi_1: faq("vi", 1)?.question ?? "",
      faq_answer_vi_1: faq("vi", 1)?.answer ?? "",
      faq_question_vi_2: faq("vi", 2)?.question ?? "",
      faq_answer_vi_2: faq("vi", 2)?.answer ?? "",
      faq_question_vi_3: faq("vi", 3)?.question ?? "",
      faq_answer_vi_3: faq("vi", 3)?.answer ?? "",
      faqs_touched: false,
      created_by: input.adminId,
      gemini_model: geminiMetadataModel,
      metadata_source: input.metadataSource ?? "gemini",
      gemini_error: input.geminiError ?? null,
    }).select("id").single();
    if (draftError) throw draftError;

    return {draftId: String(draft.id), skillId, slug, versionId, checks};
  } catch (error) {
    if (versionId) await admin.from("skill_versions").delete().eq("id", versionId);
    if (uploadedPaths.length) await admin.storage.from(artifactBucket).remove(uploadedPaths);
    if (createdSkill && skillId) await admin.from("skills").delete().eq("id", skillId);
    throw error;
  }
}

export type PlatformSkillDraft = Readonly<{
  id: string;
  skill_id: string;
  version: string;
  title_en: string;
  title_vi: string;
  description_en: string;
  description_vi: string;
  category: string;
  compatible_clients: string[];
  source_url: string | null;
  license_spdx: string | null;
  tags: string[];
  author_id: string | null;
  detail_headline_en: string;
  detail_overview_en: string;
  detail_feature_one_title_en: string;
  detail_feature_one_description_en: string;
  detail_feature_two_title_en: string;
  detail_feature_two_description_en: string;
  detail_headline_vi: string;
  detail_overview_vi: string;
  detail_feature_one_title_vi: string;
  detail_feature_one_description_vi: string;
  detail_feature_two_title_vi: string;
  detail_feature_two_description_vi: string;
  faq_question_en_1: string;
  faq_answer_en_1: string;
  faq_question_en_2: string;
  faq_answer_en_2: string;
  faq_question_en_3: string;
  faq_answer_en_3: string;
  faq_question_vi_1: string;
  faq_answer_vi_1: string;
  faq_question_vi_2: string;
  faq_answer_vi_2: string;
  faq_question_vi_3: string;
  faq_answer_vi_3: string;
  faqs_touched: boolean;
  status: "review" | "published";
  gemini_model: string;
  metadata_source: "gemini" | "manual_required" | "manual";
  gemini_error: string | null;
  created_at: string;
  updated_at: string;
  skills: {slug: string} | null;
  skill_versions: {skill_md_hash: string; skill_md_size_bytes: number | null; scan_status: string} | null;
}>;

export async function listPlatformSkillDrafts() {
  const admin = createAdminClient();
  const {data, error} = await admin.from("platform_skill_drafts")
    .select("id,skill_id,version,title_en,title_vi,description_en,description_vi,category,compatible_clients,source_url,license_spdx,tags,author_id,detail_headline_en,detail_overview_en,detail_feature_one_title_en,detail_feature_one_description_en,detail_feature_two_title_en,detail_feature_two_description_en,detail_headline_vi,detail_overview_vi,detail_feature_one_title_vi,detail_feature_one_description_vi,detail_feature_two_title_vi,detail_feature_two_description_vi,faq_question_en_1,faq_answer_en_1,faq_question_en_2,faq_answer_en_2,faq_question_en_3,faq_answer_en_3,faq_question_vi_1,faq_answer_vi_1,faq_question_vi_2,faq_answer_vi_2,faq_question_vi_3,faq_answer_vi_3,faqs_touched,status,gemini_model,metadata_source,gemini_error,created_at,updated_at,skills(slug),skill_versions(skill_md_hash,skill_md_size_bytes,scan_status)")
    .order("updated_at", {ascending: false});
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    skills: Array.isArray(row.skills) ? row.skills[0] ?? null : row.skills,
    skill_versions: Array.isArray(row.skill_versions) ? row.skill_versions[0] ?? null : row.skill_versions,
  })) as PlatformSkillDraft[];
}

export type PublishedPlatformSkill = Readonly<{
  id: string;
  slug: string;
  title: string;
  current_version: string;
  updated_at: string;
}>;

export async function listPublishedPlatformSkills() {
  const admin = createAdminClient();
  const {data, error} = await admin.from("skills")
    .select("id,slug,title,current_version,updated_at")
    .is("owner_id", null)
    .eq("visibility", "public")
    .eq("status", "active")
    .not("current_version", "is", null)
    .order("updated_at", {ascending: false});
  if (error) throw error;
  return (data ?? []) as PublishedPlatformSkill[];
}
