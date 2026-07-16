import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260716133931_skill_usage_leaderboard.sql",
  import.meta.url,
);
const dataUrl = new URL("../src/lib/catalog/leaderboard.ts", import.meta.url);
const pageUrl = new URL("../src/app/[locale]/leaderboard/page.tsx", import.meta.url);

test("leaderboard exposes only anonymous daily skill aggregates", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const tableDefinition = sql.match(
    /create table if not exists public\.skill_usage_daily \(([\s\S]*?)\n\);/i,
  )?.[1];

  assert.ok(tableDefinition);
  assert.match(tableDefinition, /skill_id uuid not null/);
  assert.match(tableDefinition, /usage_date date not null/);
  assert.match(tableDefinition, /successful_calls bigint not null/);
  assert.doesNotMatch(tableDefinition, /user_id|request_id|api_key_id/);
  assert.match(sql, /alter table public\.skill_usage_daily enable row level security/i);
  assert.match(sql, /revoke all on table public\.skill_usage_daily from public, anon, authenticated/i);
});

test("leaderboard ranks successful calls before rating and review count", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /where ue\.status = 'succeeded'/i);
  assert.match(
    sql,
    /order by\s+l\.mcp_calls desc,\s+l\.average_rating desc,\s+l\.review_count desc/i,
  );
  assert.match(sql, /p_period in \('day', 'month', 'year'\)/i);
  assert.match(sql, /at time zone 'UTC'/i);
  assert.match(sql, /security invoker/i);
  assert.match(
    sql,
    /grant execute on function public\.get_skill_leaderboard\(text, text\) to anon, authenticated/i,
  );
});

test("leaderboard frontend reads the RPC and preserves period URLs", async () => {
  const [data, page] = await Promise.all([
    readFile(dataUrl, "utf8"),
    readFile(pageUrl, "utf8"),
  ]);

  assert.match(data, /rpc\("get_skill_leaderboard"/);
  assert.match(data, /leaderboardPeriods = \["day", "month", "year"\]/);
  assert.match(page, /searchParams/);
  assert.match(page, /period=/);
  assert.match(page, /getSkillLeaderboard/);
});
