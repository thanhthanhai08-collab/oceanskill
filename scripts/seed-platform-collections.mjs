import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {const index=line.indexOf("="); return [line.slice(0,index), line.slice(index+1)];}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase server environment variables");
const supabase = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});

const entries = [
  {id:"00000000-0000-4000-8000-000000000101",slug:"gstack-engineering-workflow",title:"gstack by Garry Tan",description:"An opinionated AI engineering workflow covering product discovery, planning, design, review, QA, security, documentation, and shipping.",domain:"agent-first",version:"1.58.5.0",storage_path:"skill-artifacts/gstack.zip",compatible_clients:["Codex","Claude Code","Cursor"],source_url:"https://github.com/garrytan/gstack",license_spdx:"MIT",content:`# gstack by Garry Tan\n\nUse the official gstack repository as the source of truth. This OceanSkill entry provides discovery and provenance; install or update the upstream package before invoking its individual workflows.\n\n## Source\n\n- Repository: https://github.com/garrytan/gstack\n- License: MIT\n- Upstream version at review: 1.58.5.0\n\n## Workflow\n\n1. Choose the smallest relevant specialist.\n2. Read that upstream skill's current SKILL.md completely.\n3. Preserve its safety gates and approval boundaries.\n4. Run its verification steps before reporting completion.\n`},
  {id:"00000000-0000-4000-8000-000000000102",slug:"google-stitch-design-skills",title:"Stitch Skills by Google Labs",description:"A collection of Agent Skills for generating Stitch designs, extracting design systems, building interfaces, and producing supporting assets.",domain:"design",version:"1.0.0",storage_path:"skill-artifacts/stitch-skills.zip",compatible_clients:["Codex","Antigravity","Gemini CLI","Claude Code","Cursor"],source_url:"https://github.com/google-labs-code/stitch-skills",license_spdx:"Apache-2.0",content:`# Stitch Skills by Google Labs\n\nUse the official Stitch Skills repository as the source of truth. Select the narrowest plugin or skill and read its current SKILL.md before acting.\n\n## Source\n\n- Repository: https://github.com/google-labs-code/stitch-skills\n- License: Apache-2.0\n- Upstream release at review: v1.0\n\n## Families\n\n- Design: generate, upload, extract, and manage Stitch designs.\n- Build: React, React Native, Remotion, and shadcn/ui.\n- Utilities: prompts, DESIGN.md, Stitch loops, and design quality.\n`},
];

for (const entry of entries) {
  const {content, version, storage_path, ...metadata} = entry;
  const {data: skill, error: skillError} = await supabase.from("skills").upsert({...metadata,status:"active"},{onConflict:"slug"}).select("id").single();
  if (skillError) throw skillError;
  const contentHash = createHash("sha256").update(content).digest("hex");
  const {error: versionError} = await supabase.from("skill_versions").upsert({skill_id:skill.id,version,content_md:content,content_hash:contentHash,storage_path,scan_status:"passed",scan_summary:{pipeline:"platform-upstream-wrapper-v1",source:metadata.source_url,license:metadata.license_spdx,reviewed_at:"2026-07-03"}},{onConflict:"skill_id,version",ignoreDuplicates:true});
  if (versionError) throw versionError;
  const {error: updateError} = await supabase.from("skills").update({current_version:version}).eq("id",skill.id);
  if (updateError) throw updateError;
  console.log(`Seeded ${entry.slug} (${version})`);
}
