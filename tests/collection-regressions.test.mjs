import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {getCollectionDetailHref, isStarterCollectionId} from "../src/lib/skills/collectionSlug.ts";

test("starter collection identifiers are distinguished from persisted collections", () => {
  assert.equal(isStarterCollectionId("starter-development"), true);
  assert.equal(isStarterCollectionId("8b830688-ef86-4e98-a577-f9e445dc4fa6"), false);
  assert.equal(getCollectionDetailHref("vi", "starter-development", "starter-development"), null);
  assert.equal(
    getCollectionDetailHref("vi", "8b830688-ef86-4e98-a577-f9e445dc4fa6", "my-tools"),
    "/vi/dashboard/collections/my-tools",
  );
});

test("collection replacement is implemented as one database transaction", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260715102958_atomic_collection_update.sql", import.meta.url), "utf8");
  assert.match(sql, /security invoker/i);
  assert.match(sql, /update public\.skill_collections[\s\S]+delete from public\.skill_collection_items[\s\S]+insert into public\.skill_collection_items/i);
  assert.match(sql, /grant execute[\s\S]+to authenticated/i);
  assert.match(sql, /reserve_mcp_usage_versioned[\s\S]+p_skill_version_id[\s\S]+version_conflict/i);
});

test("duplicate collection names receive an id-based collision-resistant suffix", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260714160000_collection_slugs.sql", import.meta.url), "utf8");
  assert.match(sql, /\[deduplicated '\s*\|\|\s*duplicate_row\.id::text/i);
  assert.match(sql, /while exists[\s\S]+candidate_suffix/i);
});
