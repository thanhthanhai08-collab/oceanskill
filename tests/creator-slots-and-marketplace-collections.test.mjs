import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260717082905_creator_slots_and_public_platform_collections.sql", import.meta.url);

test("creator slots cost exactly 5,000 VND each and are applied idempotently after payment", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /p_amount_vnd % 5000 <> 0/i);
  assert.match(sql, /amount_vnd = skill_slots::bigint \* 5000/i);
  assert.match(sql, /if v_order\.status = 'paid' then return 'already_paid'/i);
  assert.match(sql, /set creator_skill_limit = creator_skill_limit \+ v_order\.skill_slots/i);
  assert.match(sql, /revoke all on function public\.create_creator_slot_payment_order[\s\S]+grant execute[\s\S]+to service_role/i);
});

test("uploaded skill cards hide hashes and use the signed-in profile identity", async () => {
  const [card, page, creatorData] = await Promise.all([
    readFile(new URL("../src/components/dashboard/CreatorSkillList.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/skills/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/skills/creator.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(card, /SHA-256|skill_md_hash/);
  assert.match(card, /ownerName/);
  assert.match(page, /ownerName=\{creatorData\.owner\.name\}/);
  assert.match(creatorData, /select\("creator_skill_limit,display_name,avatar_url,email"\)/);
});

test("platform collections are public in the marketplace but dashboard reads only the user's library", async () => {
  const [sql, marketplace, dashboard] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(new URL("../src/app/[locale]/skills/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/collections/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /for select to anon, authenticated[\s\S]+collection_type = 'platform'/i);
  assert.match(marketplace, /getPlatformSkillCollections/);
  assert.match(marketplace, /\/skills\/collections\/\$\{collection\.slug\}/);
  assert.doesNotMatch(dashboard, /getPlatformSkillCollections/);
  assert.match(dashboard, /initialCollections=\{collections\}/);
});
