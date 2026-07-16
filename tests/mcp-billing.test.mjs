import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const migrationUrl = new URL("../supabase/migrations/20260716021822_mcp_reserved_skill_references.sql", import.meta.url);
const storageMigrationUrl = new URL("../supabase/migrations/20260716080441_mcp_storage_skill_md_request_window.sql", import.meta.url);
const storageHashMigrationUrl = new URL("../supabase/migrations/20260716082210_verify_storage_skill_md_hash.sql", import.meta.url);
const hardeningMigrationUrl = new URL("../supabase/migrations/20260716090509_harden_mcp_storage_pinning.sql", import.meta.url);
const publishedHashBackfillUrl = new URL("../supabase/migrations/20260716103000_backfill_published_skill_md_hash.sql", import.meta.url);
const edgeUrl = new URL("../supabase/functions/mcp/index.ts", import.meta.url);
const publishActionUrl = new URL("../src/app/[locale]/dashboard/actions.ts", import.meta.url);

test("paid MCP usage reserves against the current version and scopes references", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /create or replace function public\.reserve_mcp_usage_resource_versioned/i);
  assert.match(sql, /from public\.reserve_mcp_usage_versioned/i);
  assert.match(sql, /set resource_key = p_resource_key/i);
  assert.match(sql, /resource_conflict/i);
});

test("MCP exposes get_skill_md and reference retrieval with reserve-finalize-release billing", async () => {
  const edge = await readFile(edgeUrl, "utf8");
  assert.match(edge, /name: "get_skill_md"/);
  assert.match(edge, /name: "get_skill_reference"/);
  assert.match(edge, /reserveMcpUsage/);
  assert.match(edge, /finalizeMcpUsage/);
  assert.match(edge, /releaseMcpUsage/);
  assert.match(edge, /withReservedUsage[\s\S]+download\(reference\.storage_path\)/);
});

test("get_skill_md downloads verified current-version Markdown from private Storage", async () => {
  const [edge, sql, hashSql] = await Promise.all([readFile(edgeUrl, "utf8"), readFile(storageMigrationUrl, "utf8"), readFile(storageHashMigrationUrl, "utf8")]);
  assert.match(sql, /add column if not exists skill_md_path text/i);
  assert.match(hashSql, /add column if not exists skill_md_hash text/i);
  assert.match(hashSql, /add column if not exists skill_md_verified_at timestamptz/i);
  assert.match(edge, /from\(version\.skill_md_bucket\)[\s\S]+download\(version\.skill_md_path/);
  assert.match(edge, /if \(!version\.skill_md_hash \|\| !version\.skill_md_verified_at\)/);
  assert.match(edge, /contentHash !== version\.skill_md_hash/);
  assert.doesNotMatch(edge, /update\(\{skill_md_hash: contentHash\}\)/);
  assert.doesNotMatch(edge, /content: version\.content_md/);
});

test("requestId exact replays expire after ten minutes while each new paid tool call costs one credit", async () => {
  const edge = await readFile(edgeUrl, "utf8");
  assert.match(edge, /requestReplayWindowMs = 10 \* 60 \* 1000/);
  assert.match(edge, /REQUEST_ID_EXPIRED/);
  assert.match(edge, /creditsCharged: replayed \? 0 : 1/);
  assert.doesNotMatch(edge, /retrievalSessionId|includeReferences/);
});

test("reference files are scoped to an exact skill version and safe storage mapping", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /create table public\.skill_reference_files/i);
  assert.match(sql, /unique \(skill_version_id, reference_key\)/i);
  assert.match(sql, /storage_bucket text not null default 'skill-artifacts'/i);
  assert.match(sql, /revoke all on public\.skill_reference_files from public, anon, authenticated/i);
});

test("SKILL.md cannot bypass get_skill_md through references and every file is publish-time hash pinned", async () => {
  const [edge, sql, backfillSql, publishAction] = await Promise.all([readFile(edgeUrl, "utf8"), readFile(hardeningMigrationUrl, "utf8"), readFile(publishedHashBackfillUrl, "utf8"), readFile(publishActionUrl, "utf8")]);
  assert.match(edge, /isReservedSkillMdReference\(referenceKey\)/);
  assert.match(edge, /async function getSkillReference[\s\S]+isReservedSkillMdReference\(referenceKey\)[\s\S]+withReservedUsage/);
  assert.match(edge, /REFERENCE_KEY_RESERVED/);
  assert.match(edge, /reference\.content_hash/);
  assert.match(edge, /referenceHash !== reference\.content_hash/);
  assert.doesNotMatch(edge, /update\(\{skill_md_hash: contentHash\}\)/);
  assert.match(sql, /delete from public\.skill_reference_files[\s\S]+lower\(replace\(reference_key,[\s\S]+\) ~ '\(\^\|\/\)skill\\\.md\$'/i);
  assert.match(sql, /add column if not exists content_hash text/i);
  assert.match(sql, /skill_reference_files_no_skill_md_check[\s\S]+lower\(replace\(reference_key,[\s\S]+\) !~ '\(\^\|\/\)skill\\\.md\$'/i);
  assert.match(sql, /drop column if exists content_hash/i);
  assert.match(sql, /current_skill_version_not_publish_ready/i);
  assert.match(backfillSql, /skill_md_hash = '98ad3e5b051bfb71b2795f7e8a6aa0d32b51ee095606c098a4b2822ac07926c9'/i);
  assert.match(publishAction, /upload\(skillMdPath, skillMdBytes,[\s\S]+upsert: false/);
  assert.match(publishAction, /skill_md_hash: scan\.skillMdHash/);
  assert.match(publishAction, /skill_md_verified_at: new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(publishAction, /content_hash:/);
});
