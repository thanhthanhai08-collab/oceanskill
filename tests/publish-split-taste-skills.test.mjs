import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260718220252_publish_split_taste_skills_retire_parent.sql", import.meta.url);
const balanceMigrationUrl = new URL("../supabase/migrations/20260718220525_preserve_retired_taste_skill_spent_credit.sql", import.meta.url);
const pinnedTitlesMigrationUrl = new URL("../supabase/migrations/20260719081826_pin_fixed_split_skill_titles.sql", import.meta.url);

test("split taste skills publish exact reviewed Storage artifacts", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const expected = [
    ["taste-skill-brutalist-skill/v2.0.0/SKILL.md", "8456", "fffbaac8597f07679e9d87145533567658aedba3b5eca6f16a7075a333048caa"],
    ["taste-skill-brandkit/v2.0.0/SKILL.md", "15992", "b0c4837e1bd140ca816ae54948754ddd2ac1e2a4d3619363777a80caf00b2ede"],
    ["taste-skill-imagegen-frontend-mobile/v2.0.0/SKILL.md", "40326", "8a33389979f3074fa0926678e266ad2eb9234624472254469fc1ad916b9caa24"],
  ];
  for (const [path, size, hash] of expected) {
    assert.match(sql, new RegExp(path.replaceAll(".", "\\.")));
    assert.match(sql, new RegExp(`\\b${size}(?:::bigint)?\\b`));
    assert.match(sql, new RegExp(hash));
  }
  assert.match(sql, /taste-skill-brandkit\/v2\.0\.0\/LICENSE/);
  assert.match(sql, /skill_md_verified_at/);
  assert.match(sql, /status = 'active', current_version = '2\.0\.0'/);
});

test("retiring taste-skill clears usage safely and preserves the platform collection", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const ledgerDelete = sql.indexOf("delete from public.credit_ledger");
  const usageDelete = sql.indexOf("delete from public.usage_events");
  const skillDelete = sql.indexOf("delete from public.skills where slug = 'taste-skill'");
  assert.ok(ledgerDelete >= 0 && usageDelete > ledgerDelete && skillDelete > usageDelete);
  assert.match(sql, /delete from public\.mcp_call_events[\s\S]+request_id in/);
  assert.match(sql, /retire:taste-skill:preserve-spent-credit/);
  assert.ok(sql.indexOf("retire:taste-skill:preserve-spent-credit") < ledgerDelete);
  assert.match(sql, /taste_skill_collection_membership_incomplete/);
  assert.match(sql, /'taste-skill-gpt-tasteskill'[\s\S]+'taste-skill-redesign-skill'[\s\S]+'taste-skill-brutalist-skill'[\s\S]+'taste-skill-brandkit'[\s\S]+'imagegen-frontend-mobile'/);
  assert.doesNotMatch(sql, /delete from public\.skill_collections/);
});

test("the live retirement correction preserves the spent credit without restoring usage", async () => {
  const sql = await readFile(balanceMigrationUrl, "utf8");
  assert.match(sql, /'adjustment'/);
  assert.match(sql, /units = -1/);
  assert.match(sql, /usage_event_id is null/);
  assert.match(sql, /on conflict \(idempotency_key\) do nothing/);
  assert.doesNotMatch(sql, /insert into public\.usage_events/);
});

test("split skill titles are pinned to exact slugs in English and Vietnamese", async () => {
  const sql = await readFile(pinnedTitlesMigrationUrl, "utf8");
  for (const slug of ["taste-skill-brutalist-skill", "taste-skill-brandkit", "imagegen-frontend-mobile"]) {
    assert.match(sql, new RegExp(slug));
  }
  assert.match(sql, /update public\.skills[\s\S]+set title = slug/i);
  assert.match(sql, /update public\.skill_translations[\s\S]+set title = skill\.slug/i);
  assert.match(sql, /set title_en = skill\.slug, title_vi = skill\.slug/i);
  assert.match(sql, /create trigger skills_pin_fixed_title/i);
  assert.match(sql, /create trigger skill_translations_pin_fixed_title/i);
  assert.match(sql, /create trigger platform_skill_drafts_pin_fixed_titles/i);
});
