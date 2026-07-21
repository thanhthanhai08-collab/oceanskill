import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migration = new URL(
  "../supabase/migrations/20260721073918_sync_skill_titles_to_translations.sql",
  import.meta.url,
);

test("skill title edits synchronize the English and Vietnamese translations", async () => {
  const sql = await readFile(migration, "utf8");

  assert.match(sql, /security definer[\s\S]+set search_path = ''/i);
  assert.match(sql, /\(new\.id, 'en', new\.title/i);
  assert.match(sql, /\(new\.id, 'vi', new\.title/i);
  assert.match(sql, /on conflict \(skill_id, locale\)[\s\S]+set title = excluded\.title/i);
  assert.match(sql, /after update of title on public\.skills/i);
  assert.match(sql, /when \(old\.title is distinct from new\.title\)/i);
  assert.match(
    sql,
    /revoke all on function private\.sync_skill_title_translations\(\)[\s\S]+from public, anon, authenticated/i,
  );
  assert.doesNotMatch(sql, /drop\s+(?:column\s+)?description/i);
});
