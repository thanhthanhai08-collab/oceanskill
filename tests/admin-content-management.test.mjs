import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migration = new URL("../supabase/migrations/20260719040940_admin_collections_and_blog_markdown.sql", import.meta.url);

test("admin collection and blog drafts stay private until transactional publish", async () => {
  const sql = await readFile(migration, "utf8");
  for (const table of ["platform_collection_drafts", "blog_post_drafts"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /revoke all on public\.platform_collection_drafts, public\.blog_post_drafts from public, anon, authenticated/i);
  assert.match(sql, /publish_platform_collection_draft[\s\S]+status = 'active'[\s\S]+visibility = 'public'/i);
  assert.match(sql, /publish_blog_post_draft[\s\S]+status = 'published'/i);
  assert.match(sql, /grant execute on function public\.publish_platform_collection_draft\(uuid, uuid\) to service_role/i);
  assert.match(sql, /grant execute on function public\.publish_blog_post_draft\(uuid, uuid\) to service_role/i);
});

test("Gemini uses 2.5 Flash and previews share safe public renderers", async () => {
  const [gemini, markdown, publicBlog, skillPreview, collectionPreview, blogPreview] = await Promise.all([
    readFile(new URL("../src/lib/skills/gemini-metadata.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/blog/MarkdownArticle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/skills/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/collections/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/blog/[id]/preview/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(gemini, /gemini-2\.5-flash/);
  assert.match(markdown, /"h2" \| "h3" \| "h4"/);
  assert.match(markdown, /<table>/);
  assert.match(markdown, /<br\/>/);
  assert.doesNotMatch(markdown, /dangerouslySetInnerHTML/);
  assert.match(publicBlog, /MarkdownArticle/);
  for (const preview of [skillPreview, collectionPreview, blogPreview]) {
    assert.match(preview, /getPlatformAdmin\(\)/);
    assert.match(preview, /index:false/);
  }
});
