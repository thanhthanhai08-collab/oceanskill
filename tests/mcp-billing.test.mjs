import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const migrationUrl = new URL("../supabase/migrations/20260716021822_mcp_reserved_skill_references.sql", import.meta.url);
const edgeUrl = new URL("../supabase/functions/mcp/index.ts", import.meta.url);

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

test("reference files are scoped to an exact skill version and safe storage mapping", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /create table public\.skill_reference_files/i);
  assert.match(sql, /unique \(skill_version_id, reference_key\)/i);
  assert.match(sql, /storage_bucket text not null default 'skill-artifacts'/i);
  assert.match(sql, /revoke all on public\.skill_reference_files from public, anon, authenticated/i);
});
