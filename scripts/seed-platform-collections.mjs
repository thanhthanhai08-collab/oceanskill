import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {const index=line.indexOf("="); return [line.slice(0,index), line.slice(index+1)];}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase server environment variables");
const supabase = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});

const entries = [
  {id:"00000000-0000-4000-8000-000000000101",slug:"gstack-engineering-workflow",title:"gstack by Garry Tan",description:"An opinionated AI engineering workflow covering product discovery, planning, design, review, QA, security, documentation, and shipping.",domain:"agent-first",version:"1.58.5.0",compatible_clients:["Codex","Claude Code","Cursor"],source_url:"https://github.com/garrytan/gstack",license_spdx:"MIT",content:`# gstack by Garry Tan\n\nUse the official gstack repository as the source of truth. This OceanSkill entry provides discovery and provenance; install or update the upstream package before invoking its individual workflows.\n\n## Source\n\n- Repository: https://github.com/garrytan/gstack\n- License: MIT\n- Upstream version at review: 1.58.5.0\n\n## Workflow\n\n1. Choose the smallest relevant specialist.\n2. Read that upstream skill's current SKILL.md completely.\n3. Preserve its safety gates and approval boundaries.\n4. Run its verification steps before reporting completion.\n`},
  {id:"00000000-0000-4000-8000-000000000102",slug:"google-stitch-design-skills",title:"Stitch Skills by Google Labs",description:"A collection of Agent Skills for generating Stitch designs, extracting design systems, building interfaces, and producing supporting assets.",domain:"design",version:"1.0.0",compatible_clients:["Codex","Antigravity","Gemini CLI","Claude Code","Cursor"],source_url:"https://github.com/google-labs-code/stitch-skills",license_spdx:"Apache-2.0",content:`# Stitch Skills by Google Labs\n\nUse the official Stitch Skills repository as the source of truth. Select the narrowest plugin or skill and read its current SKILL.md before acting.\n\n## Source\n\n- Repository: https://github.com/google-labs-code/stitch-skills\n- License: Apache-2.0\n- Upstream release at review: v1.0\n\n## Families\n\n- Design: generate, upload, extract, and manage Stitch designs.\n- Build: React, React Native, Remotion, and shadcn/ui.\n- Utilities: prompts, DESIGN.md, Stitch loops, and design quality.\n`},
];

for (const entry of entries) {
  const {content, version, ...metadata} = entry;
  const {data: skill, error: skillError} = await supabase.from("skills").upsert(metadata,{onConflict:"slug"}).select("id").single();
  if (skillError) throw skillError;
  const skillMdBytes = Buffer.from(content, "utf8");
  const skillMdHash = createHash("sha256").update(skillMdBytes).digest("hex");
  const skillMdPath = `skills/${skill.id}/${version}/SKILL.md`;
  const {error: uploadError} = await supabase.storage.from("skill-artifacts").upload(skillMdPath, skillMdBytes, {contentType:"text/markdown; charset=utf-8",cacheControl:"31536000",upsert:false});
  if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
  const {data: stored, error: downloadError} = await supabase.storage.from("skill-artifacts").download(skillMdPath);
  if (downloadError || !stored) throw downloadError ?? new Error("Could not verify uploaded SKILL.md");
  const storedHash = createHash("sha256").update(Buffer.from(await stored.arrayBuffer())).digest("hex");
  if (storedHash !== skillMdHash) throw new Error(`Immutable SKILL.md conflict for ${entry.slug} (${version})`);
  const {error: versionError} = await supabase.from("skill_versions").upsert({skill_id:skill.id,version,content_md:content,skill_md_bucket:"skill-artifacts",skill_md_path:skillMdPath,skill_md_size_bytes:skillMdBytes.byteLength,skill_md_hash:skillMdHash,skill_md_verified_at:new Date().toISOString(),scan_status:"passed",scan_summary:{pipeline:"platform-upstream-wrapper-v2",source:metadata.source_url,license:metadata.license_spdx,reviewed_at:new Date().toISOString()}},{onConflict:"skill_id,version"});
  if (versionError) throw versionError;
  const {error: updateError} = await supabase.from("skills").update({status:"active",current_version:version}).eq("id",skill.id);
  if (updateError) throw updateError;
  console.log(`Seeded ${entry.slug} (${version})`);
}
