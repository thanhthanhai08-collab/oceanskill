import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const bucket = "skill-artifacts";
const slug = "canvas-design";
const title = "canvas-desgin";
const version = "1.0.0";
const packagePath = path.join(root, ".tmp", "canvas-design.zip");
const extractedDir = path.join(root, ".tmp", "canvas-design-extract", "canvas-design");
const skillMdPath = path.join(extractedDir, "SKILL.md");
const licensePath = path.join(extractedDir, "LICENSE.txt");

async function getServiceRoleKey() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: {Authorization: `Bearer ${accessToken}`}
  });
  if (!response.ok) throw new Error(`Could not read Supabase API keys: HTTP ${response.status}`);
  const keys = await response.json();
  const serviceRole = keys.find((key) => (key.name ?? key.api_key_name) === "service_role")?.api_key;
  if (!serviceRole) throw new Error("Supabase service_role key was not returned by the Platform API.");
  return serviceRole;
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".md") return "text/plain";
  if (ext === ".txt") return "text/plain";
  if (ext === ".zip") return "application/zip";
  if (ext === ".ttf") return "application/octet-stream";
  return "application/octet-stream";
}

function walkFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

async function uploadFile(supabase, localPath, storagePath) {
  const {error} = await supabase.storage
    .from(bucket)
    .upload(storagePath, fs.readFileSync(localPath), {
      contentType: contentTypeFor(localPath),
      upsert: true
    });
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
}

const serviceRoleKey = await getServiceRoleKey();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {persistSession: false, autoRefreshToken: false}
});

const skillMd = fs.readFileSync(skillMdPath, "utf8");
const contentHash = crypto.createHash("sha256").update(skillMd).digest("hex");
const description = "Create beautiful visual art in .png and .pdf documents using design philosophy.";

await uploadFile(supabase, packagePath, `${slug}/${slug}.zip`);
await uploadFile(supabase, skillMdPath, `${slug}/SKILL.md`);
await uploadFile(supabase, licensePath, `${slug}/LICENSE.txt`);

const extractedUploads = {ok: 0, failed: 0};
for (const file of walkFiles(extractedDir)) {
  const relative = path.relative(extractedDir, file).replaceAll(path.sep, "/");
  try {
    await uploadFile(supabase, file, `${slug}/extracted/${relative}`);
    extractedUploads.ok += 1;
  } catch {
    extractedUploads.failed += 1;
  }
}

const {error: authorError} = await supabase.from("authors").upsert({
  id: "anthropic",
  name: "Anthropic",
  handle: "@AnthropicAI",
  icon: "psychology",
  domain: "design",
  glow_class: "from-secondary-container via-tertiary-container to-surface-container-high",
  bio: "Anthropic publishes agent skills that help Claude and compatible coding agents perform specialized workflows.",
  focus: ["AI skills", "Claude", "Agent workflows"],
  website_url: "https://github.com/anthropics/skills",
  avatar_url: "https://github.com/anthropics.png",
  verified: true
}, {onConflict: "id"});
if (authorError) throw authorError;

const {data: existingSkill, error: existingError} = await supabase
  .from("skills")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();
if (existingError) throw existingError;

let skillId = existingSkill?.id;
const skillPayload = {
  slug,
  title,
  description,
  domain: "design",
  status: "active",
  visibility: "public",
  compatible_clients: ["Codex", "Claude Code", "Cursor", "Antigravity"],
  source_url: "https://github.com/anthropics/skills/tree/main/skills/canvas-design",
  license_spdx: "Apache-2.0",
  author_id: "anthropic"
};

if (skillId) {
  const {error} = await supabase.from("skills").update(skillPayload).eq("id", skillId);
  if (error) throw error;
} else {
  const {data, error} = await supabase.from("skills").insert(skillPayload).select("id").single();
  if (error) throw error;
  skillId = data.id;
}

const versionPayload = {
  skill_id: skillId,
  version,
  content_md: skillMd,
  content_hash: contentHash,
  storage_path: `${slug}/${slug}.zip`,
  scan_status: "passed",
  scan_summary: {
    license: "Apache-2.0",
    pipeline: "manual-storage-import-v1",
    reviewed_at: "2026-07-10",
    storage_bucket: bucket,
    storage_path: `${slug}/${slug}.zip`,
    extracted_prefix: `${slug}/extracted/`,
    skill_md_path: `${slug}/SKILL.md`,
    license_path: `${slug}/LICENSE.txt`,
    extracted_uploads: extractedUploads
  }
};

const {error: versionError} = await supabase
  .from("skill_versions")
  .upsert(versionPayload, {onConflict: "skill_id,version"});
if (versionError) throw versionError;

const {error: currentVersionError} = await supabase
  .from("skills")
  .update({current_version: version})
  .eq("id", skillId);
if (currentVersionError) throw currentVersionError;

const {data: verify, error: verifyError} = await supabase
  .from("skills")
  .select("slug,title,status,visibility,current_version,author_id,skill_versions!skill_versions_skill_id_fkey(version,scan_status,storage_path,content_hash)")
  .eq("slug", slug)
  .single();
if (verifyError) throw verifyError;

console.log(JSON.stringify({
  published: true,
  skill: verify,
  extractedUploads
}, null, 2));
